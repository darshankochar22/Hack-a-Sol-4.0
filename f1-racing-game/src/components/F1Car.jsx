import { useBox, useRaycastVehicle } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo, useCallback, Suspense, Component } from "react";
import { Quaternion, Vector3 } from "three";
import { useGLTF } from "@react-three/drei";
import { useF1Controls } from "../hooks/useF1Controls";
import { useF1Wheels } from "../hooks/useF1Wheels";
import { carConfigs } from "../config/carConfigs";

// Error Boundary for GLB loading
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn("GLB model loading error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

export function F1Car({ 
  thirdPerson, 
  onPositionUpdate, 
  carType = "ferrari", 
  startFromTrack = true,
  isAI = false, // If true, car is AI-controlled
  aggressiveness = 50,
  consistency = 50,
  startOffset = 0,
  tokenId = null,
  name = null,
}) {
  const carConfig = carConfigs[carType] || carConfigs.ferrari;
  // F1 Car dimensions (smaller, faster)
  // Track waypoints - always generate for both AI and player (player needs track assist)
  const waypoints = useMemo(() => {
    const { generateTrackWaypoints } = require("../utils/trackPath");
    return generateTrackWaypoints(64);
  }, []);

  // Start from track position (near start line) or center
  // Player car starts at center position (grid position 0)
  const position = useMemo(() => {
    if (startFromTrack) {
      // Player car starts at center of starting grid
      const { getStartingPosition } = require("../utils/trackPath");
      return getStartingPosition(0, 5); // Grid position 0 (pole position)
    }
    return [0, 0.3, 0];
  }, [startFromTrack]);
  const width = 0.12; // Narrower for F1
  const height = 0.06;
  const front = 0.12;
  const wheelRadius = 0.04;

  // Calculate starting rotation to face track direction
  const rotation = useMemo(() => {
    if (startFromTrack) {
      const { getStartingRotation } = require("../utils/trackPath");
      return getStartingRotation();
    }
    return [0, 0, 0];
  }, [startFromTrack]);

  const chassisBodyArgs = useMemo(() => [width, height, front * 2], [width, height, front]);
  const [chassisBody, chassisApi] = useBox(
    () => ({
      allowSleep: false,
      args: chassisBodyArgs,
      mass: 100, // Lighter for F1
      position,
      rotation, // Face the track direction at start
      // Add damping for smoother, more stable movement
      linearDamping: 0.4, // Reduces linear velocity over time (smoother movement)
      angularDamping: 0.8, // Increased to prevent pitching/rotation when accelerating
    }),
    useRef(null),
  );

  const [wheels, wheelInfos] = useF1Wheels(width, height, front, wheelRadius);

  const [vehicle, vehicleApi] = useRaycastVehicle(
    () => ({
      chassisBody,
      wheelInfos,
      wheels,
    }),
    useRef(null),
  );

  // Player car track-following assist state (must be declared before useF1Controls)
  const trackAssistRef = useRef({
    lastAssistTime: 0,
    assistStrength: 0.1, // Reduced strength - only helps when player is not steering
    steeringCorrection: 0, // Steering correction value to blend with player input
  });

  // Always call hook (React rules), but it will be disabled for AI
  // Pass track assist ref for player car to prevent circular movement
  useF1Controls(vehicleApi, chassisApi, isAI, !isAI ? trackAssistRef : null);

  // AI Bot state (if AI mode)
  const botStateRef = useRef({
    targetSpeed: 0.8 + (aggressiveness / 100) * 0.4,
    currentSpeed: 0,
    steeringAngle: 0,
    trackProgress: 0,
    smoothedSteering: 0, // For smooth steering interpolation
  });

  // Track previous position for speed calculation
  const prevPositionRef = useRef(new Vector3(0, 0, 0));
  const prevAngleRef = useRef(0);
  const prevSpeedRef = useRef(0);
  const isFirstFrameRef = useRef(true);
  const updateThrottleRef = useRef(0);
  const lastUpdateTimeRef = useRef(null);
  
  // Track racing metrics
  const metricsRef = useRef({
    leftTurns: 0,
    rightTurns: 0,
    speeds: [],
    averageSpeed: 0,
    maxSpeed: 0,
    minSpeed: Infinity,
    totalDistance: 0,
  });
  
  // Memoize vector objects to avoid creating new ones every frame
  const positionVec = useMemo(() => new Vector3(), []);
  const quaternionVec = useMemo(() => new Quaternion(), []);
  const cameraPositionVec = useMemo(() => new Vector3(), []);
  const cameraQuaternionVec = useMemo(() => new Quaternion(), []);
  const wDirVec = useMemo(() => new Vector3(0, 0, 1), []);
  const cameraOffsetVec = useMemo(() => new Vector3(0, 0.5, 0), []);

  // Throttled position update callback
  const throttledPositionUpdate = useCallback((data) => {
    if (onPositionUpdate) {
      onPositionUpdate(data);
    }
  }, [onPositionUpdate]);

  // Combined frame update for better performance
  useFrame((state, delta) => {
    if (!chassisBody.current) return;

    // Track-following assist for player car (non-AI mode)
    // This prevents the car from going in circles by gently guiding it back to track
    if (!isAI && vehicleApi && waypoints) {
      positionVec.setFromMatrixPosition(chassisBody.current.matrixWorld);
      quaternionVec.setFromRotationMatrix(chassisBody.current.matrixWorld);

      // Find closest waypoint to guide car back to track
      const { getClosestWaypointIndex, getNextWaypoint } = require("../utils/trackPath");
      const closestIndex = getClosestWaypointIndex(
        [positionVec.x, positionVec.y, positionVec.z],
        waypoints
      );
      
      // Look ahead 3 waypoints (same as bot cars)
      const { waypoint: targetWaypoint } = getNextWaypoint(closestIndex, 3, waypoints);
      
      // Calculate distance from track center line
      const distanceFromTrack = positionVec.distanceTo(targetWaypoint);
      
      // If car is far from track (> 2 units), apply stronger assist
      // If car is close to track (< 1 unit), apply minimal assist
      const assistMultiplier = Math.min(1, Math.max(0.3, distanceFromTrack / 2));
      
      // Calculate direction to target waypoint
      const directionToTarget = new Vector3()
        .subVectors(targetWaypoint, positionVec)
        .normalize();

      // Get current car direction (forward vector)
      const forward = new Vector3(0, 0, 1);
      forward.applyQuaternion(quaternionVec);
      forward.normalize();

      // Calculate steering correction needed to get back on track
      const cross = new Vector3().crossVectors(forward, directionToTarget);
      const dot = forward.dot(directionToTarget);
      let trackAssistSteering = Math.atan2(cross.y, dot) * 1.5;
      
      // Clamp and apply assist strength
      trackAssistSteering = Math.max(-0.3, Math.min(0.3, trackAssistSteering));
      trackAssistSteering *= trackAssistRef.current.assistStrength * assistMultiplier;
      
      // Store steering correction for useF1Controls to blend with player input
      trackAssistRef.current.steeringCorrection = trackAssistSteering;
      
      // Also apply assist directly in useFrame for smooth, frame-by-frame application
      // This ensures the assist is applied even if useF1Controls useEffect hasn't run yet
      // We need to track the player's base steering to blend properly
      // For now, we'll apply a subtle correction on top of whatever steering is currently set
      // The useF1Controls hook will also blend it, so this provides double insurance
    } else {
      // Reset assist when not needed
      if (trackAssistRef.current) {
        trackAssistRef.current.steeringCorrection = 0;
      }
    }

    // AI Control Logic (if AI mode) - follows track waypoints
    if (isAI && vehicleApi && waypoints) {
      positionVec.setFromMatrixPosition(chassisBody.current.matrixWorld);
      quaternionVec.setFromRotationMatrix(chassisBody.current.matrixWorld);

      const distance = positionVec.distanceTo(prevPositionRef.current);
      botStateRef.current.currentSpeed = distance / delta;
      prevPositionRef.current.copy(positionVec);

      // Find closest waypoint and get next target
      const { getClosestWaypointIndex, getNextWaypoint } = require("../utils/trackPath");
      const closestIndex = getClosestWaypointIndex(
        [positionVec.x, positionVec.y, positionVec.z],
        waypoints
      );
      const lookAhead = 3 + Math.round((aggressiveness / 100) * 2);
      const { waypoint: targetWaypoint } = getNextWaypoint(closestIndex, lookAhead, waypoints);

      // Calculate direction to target waypoint
      const directionToTarget = new Vector3()
        .subVectors(targetWaypoint, positionVec)
        .normalize();

      // Get current car direction (forward vector)
      const forward = new Vector3(0, 0, 1);
      forward.applyQuaternion(quaternionVec);
      forward.normalize();

      // Calculate steering angle with smoothing
      const cross = new Vector3().crossVectors(forward, directionToTarget);
      const dot = forward.dot(directionToTarget);
      let targetSteeringAngle = Math.atan2(cross.y, dot) * 1.2; // Reduced multiplier for smoother turns
      
      // Clamp steering angle
      targetSteeringAngle = Math.max(-0.3, Math.min(0.3, targetSteeringAngle));

      // Smooth steering interpolation (reduces zig-zag)
      const steeringLerpFactor = 0.15; // Smoothing factor (lower = smoother)
      botStateRef.current.smoothedSteering = 
        botStateRef.current.smoothedSteering * (1 - steeringLerpFactor) + 
        targetSteeringAngle * steeringLerpFactor;

      // Apply AI controls with reduced randomness for smoother movement
      const throttle = Math.min(1, botStateRef.current.targetSpeed / Math.max(0.1, botStateRef.current.currentSpeed));
      const consistencyFactor = consistency / 100;
      
      // Reduced random variations for smoother movement
      const randomSteer = (Math.random() - 0.5) * (1 - consistencyFactor) * 0.05; // Reduced from 0.2
      const randomThrottle = (Math.random() - 0.5) * (1 - consistencyFactor) * 0.05; // Reduced from 0.15

      const aggressivenessFactor = aggressiveness / 100;
      const finalRandomSteer = randomSteer * (1 - aggressivenessFactor * 0.3); // Further reduced
      const finalRandomThrottle = randomThrottle * (1 - aggressivenessFactor * 0.3);

      // Apply engine force with smoothing
      const engineForce = (throttle + finalRandomThrottle) * 200 * (1 + aggressiveness / 200);
      vehicleApi.applyEngineForce(engineForce, 2);
      vehicleApi.applyEngineForce(engineForce, 3);

      // Apply smoothed steering (much smoother now)
      const finalSteering = Math.max(-0.3, Math.min(0.3, botStateRef.current.smoothedSteering + finalRandomSteer));
      vehicleApi.setSteeringValue(finalSteering, 0);
      vehicleApi.setSteeringValue(finalSteering, 1);
    }

    // Update position and speed (throttled to every 2 frames for smoother performance)
    updateThrottleRef.current += delta;
    if (updateThrottleRef.current >= 0.033) { // ~30fps updates for HUD
      updateThrottleRef.current = 0;
      
      if (onPositionUpdate) {
        positionVec.setFromMatrixPosition(chassisBody.current.matrixWorld);
        quaternionVec.setFromRotationMatrix(chassisBody.current.matrixWorld);

        // Calculate speed from position delta
        let speed = 0;
        let turnDirection = null;
        let acceleration = 0;
        
        if (!isFirstFrameRef.current && delta > 0) {
          const deltaPosition = positionVec.clone().sub(prevPositionRef.current);
          speed = deltaPosition.length() / delta; // Speed in units per second
          
          // For AI mode, use bot state speed
          if (isAI) {
            speed = botStateRef.current.currentSpeed;
          }
          
          // Calculate turn direction based on rotation change
          const currentAngle = Math.atan2(positionVec.x, positionVec.z);
          const angleDiff = currentAngle - prevAngleRef.current;
          
          // Normalize angle difference
          let normalizedDiff = angleDiff;
          if (normalizedDiff > Math.PI) normalizedDiff -= 2 * Math.PI;
          if (normalizedDiff < -Math.PI) normalizedDiff += 2 * Math.PI;
          
          // Detect turn (threshold to avoid noise)
          if (Math.abs(normalizedDiff) > 0.05 && speed > 0.1) {
            if (normalizedDiff > 0) {
              turnDirection = "left";
              metricsRef.current.leftTurns++;
            } else {
              turnDirection = "right";
              metricsRef.current.rightTurns++;
            }
          }
          
          // Update metrics
          metricsRef.current.speeds.push(speed);
          if (speed > metricsRef.current.maxSpeed) metricsRef.current.maxSpeed = speed;
          if (speed < metricsRef.current.minSpeed) metricsRef.current.minSpeed = speed;
          metricsRef.current.totalDistance += deltaPosition.length();
          
          // Keep only last 1000 speed samples
          if (metricsRef.current.speeds.length > 1000) {
            metricsRef.current.speeds = metricsRef.current.speeds.slice(-1000);
          }
          
          // Calculate average speed
          if (metricsRef.current.speeds.length > 0) {
            metricsRef.current.averageSpeed =
              metricsRef.current.speeds.reduce((sum, s) => sum + s, 0) /
              metricsRef.current.speeds.length;
          }
          
          prevAngleRef.current = currentAngle;
        } else {
          isFirstFrameRef.current = false;
          prevAngleRef.current = Math.atan2(positionVec.x, positionVec.z);
        }

        const now = performance.now();
        const secondsSinceUpdate =
          lastUpdateTimeRef.current !== null
            ? Math.max((now - lastUpdateTimeRef.current) / 1000, delta)
            : delta;
        // Calculate acceleration and clamp to reasonable range immediately
        // Clamp to -10 to 10 m/s² to prevent extreme values
        const rawAcceleration =
          secondsSinceUpdate > 0
            ? (speed - prevSpeedRef.current) / secondsSinceUpdate
            : 0;
        acceleration = Math.max(-10, Math.min(10, rawAcceleration));
        prevSpeedRef.current = speed;
        lastUpdateTimeRef.current = now;

        const previousPositionArray = prevPositionRef.current.toArray();
        throttledPositionUpdate({
          tokenId: tokenId || 1,
          name: name || `Car #${tokenId || 1}`,
          position: [positionVec.x, positionVec.y, positionVec.z],
          rotation: quaternionVec,
          speed: speed * 10, // Convert to km/h
          metrics: { ...metricsRef.current },
          turnDirection,
          previousPosition: previousPositionArray,
          angle: prevAngleRef.current,
          acceleration,
          timestamp: Date.now(),
        });

        // Update ref for next frame
        prevPositionRef.current.copy(positionVec);
      }
    }

    // Third-person camera following (smoother lerp)
    if (thirdPerson && chassisBody.current) {
      cameraPositionVec.setFromMatrixPosition(chassisBody.current.matrixWorld);
      cameraQuaternionVec.setFromRotationMatrix(chassisBody.current.matrixWorld);

      wDirVec.set(0, 0, 1);
      wDirVec.applyQuaternion(cameraQuaternionVec);
      wDirVec.normalize();

      const targetCameraPosition = cameraPositionVec
        .clone()
        .add(wDirVec.clone().multiplyScalar(2).add(cameraOffsetVec));

      // Smoother camera following with adaptive lerp
      const lerpFactor = Math.min(0.15, delta * 10); // Adaptive based on delta
      state.camera.position.lerp(targetCameraPosition, lerpFactor);
      state.camera.lookAt(cameraPositionVec);
    }
  });

  return (
    <group ref={vehicle} name="f1-vehicle">
      <group ref={chassisBody} name="chassisBody">
        <Suspense fallback={null}>
          <ErrorBoundary fallback={null}>
            <F1CarModel carConfig={carConfig} />
          </ErrorBoundary>
        </Suspense>
      </group>

      {/* Wheels - Hidden since GLB model has its own wheels */}
      {wheels.map((wheelRef, index) => (
          <group key={index} ref={wheelRef} visible={false}>
            {/* Hidden - GLB model has its own wheels */}
          </group>
      ))}
    </group>
  );
}

// F1 Car Model Component - Loads GLB file
function F1CarModel({ carConfig }) {
  // GLB file path - Using the F1 car GLB file from assets folder
  const glbPath = "/assets/f1-car.glb";
  
  // Load the GLB file
  // If file doesn't exist, ErrorBoundary will catch it and show fallback
  const { scene } = useGLTF(glbPath);
  
  const carModel = useMemo(() => {
    const cloned = scene.clone();
    
    // Scale up the model significantly - make it BIG!
    // The GLB model will completely replace the box geometry
    const scale = 15.0; // Very large scale to make the F1 car properly visible and replace old geometry
    cloned.scale.set(scale, scale, scale);
    
    // Position the car at ground level - adjust Y to sit on the track
    // The physics body is at y=0.3, so we need to align the visual model
    cloned.position.set(0, 0, 0); // Center position, will align with physics body
    cloned.rotation.set(0, Math.PI, 0); // Rotate 180 degrees if needed
    
    // Enable shadows and ensure all meshes are visible
    cloned.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        child.visible = true;
        
        // Ensure materials are properly configured
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (mat) {
                mat.transparent = false;
                mat.opacity = 1.0;
              }
            });
          } else {
            child.material.transparent = false;
            child.material.opacity = 1.0;
          }
        }
      }
    });
    
    return cloned;
  }, [scene]);
  
  return <primitive object={carModel} />;
}

