import { useBox, useRaycastVehicle } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo, useCallback } from "react";
import { Quaternion, Vector3 } from "three";
import { useF1Controls } from "../hooks/useF1Controls";
import { useF1Wheels } from "../hooks/useF1Wheels";
import { carConfigs } from "../config/carConfigs";

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
  // Track waypoints for AI mode
  const waypoints = useMemo(() => {
    if (isAI) {
      const { generateTrackWaypoints } = require("../utils/trackPath");
      return generateTrackWaypoints(64);
    }
    return null;
  }, [isAI]);

  // Start from track position (near start line) or center
  const position = useMemo(() => {
    if (startFromTrack) {
      if (isAI) {
        const { getStartingPosition } = require("../utils/trackPath");
        return getStartingPosition(startOffset || 0, 5);
      }
      // Start near the start/finish line on the track (z=15, slightly offset)
      return [0, 0.3, 14.5];
    }
    return [0, 0.3, 0];
  }, [startFromTrack, isAI, startOffset]);
  const width = 0.12; // Narrower for F1
  const height = 0.06;
  const front = 0.12;
  const wheelRadius = 0.04;

  const chassisBodyArgs = useMemo(() => [width, height, front * 2], [width, height, front]);
  const [chassisBody, chassisApi] = useBox(
    () => ({
      allowSleep: false,
      args: chassisBodyArgs,
      mass: 100, // Lighter for F1
      position,
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

  // Always call hook (React rules), but it will be disabled for AI
  useF1Controls(vehicleApi, chassisApi, isAI);

  // AI Bot state (if AI mode)
  const botStateRef = useRef({
    targetSpeed: 0.8 + (aggressiveness / 100) * 0.4,
    currentSpeed: 0,
    steeringAngle: 0,
    trackProgress: 0,
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

      // Calculate steering angle
      const cross = new Vector3().crossVectors(forward, directionToTarget);
      const dot = forward.dot(directionToTarget);
      let steeringAngle = Math.atan2(cross.y, dot) * 2;

      // Apply AI controls
      const throttle = Math.min(1, botStateRef.current.targetSpeed / Math.max(0.1, botStateRef.current.currentSpeed));
      const consistencyFactor = consistency / 100;
      const randomSteer = (Math.random() - 0.5) * (1 - consistencyFactor) * 0.2;
      const randomThrottle = (Math.random() - 0.5) * (1 - consistencyFactor) * 0.15;

      const aggressivenessFactor = aggressiveness / 100;
      const finalRandomSteer = randomSteer * (1 - aggressivenessFactor * 0.5);
      const finalRandomThrottle = randomThrottle * (1 - aggressivenessFactor * 0.5);

      vehicleApi.applyEngineForce(
        (throttle + finalRandomThrottle) * 200 * (1 + aggressiveness / 200),
        2
      );
      vehicleApi.applyEngineForce(
        (throttle + finalRandomThrottle) * 200 * (1 + aggressiveness / 200),
        3
      );

      vehicleApi.setSteeringValue(
        Math.max(-0.5, Math.min(0.5, steeringAngle + finalRandomSteer)),
        0
      );
      vehicleApi.setSteeringValue(
        Math.max(-0.5, Math.min(0.5, steeringAngle + finalRandomSteer)),
        1
      );
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
        {/* Main F1 Car body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={chassisBodyArgs} />
          <meshStandardMaterial
            color={carConfig.bodyColor}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        
        {/* Front wing */}
        <mesh position={[0, -height * 0.3, front * 0.9]}>
          <boxGeometry args={[width * 1.2, 0.01, 0.03]} />
          <meshStandardMaterial color={carConfig.details.frontWing} metalness={0.7} />
        </mesh>
        
        {/* Rear wing */}
        <mesh position={[0, height * 0.2, -front * 0.9]}>
          <boxGeometry args={[width * 0.9, 0.04, 0.02]} />
          <meshStandardMaterial color={carConfig.details.rearWing} metalness={0.7} />
        </mesh>
        
        {/* Driver cockpit */}
        <mesh position={[0, height * 0.15, -0.02]}>
          <boxGeometry args={[width * 0.5, 0.04, 0.1]} />
          <meshStandardMaterial color={carConfig.details.cockpit} />
        </mesh>
        
        {/* Nose cone */}
        <mesh position={[0, 0, front * 0.95]}>
          <boxGeometry args={[width * 0.4, height * 0.6, 0.05]} />
          <meshStandardMaterial color={carConfig.bodyColor} metalness={0.9} />
        </mesh>
        
        {/* Side pods */}
        <mesh position={[-width * 0.6, -height * 0.1, 0]}>
          <boxGeometry args={[0.02, height * 0.8, front * 1.2]} />
          <meshStandardMaterial color={carConfig.secondaryColor} metalness={0.8} />
        </mesh>
        <mesh position={[width * 0.6, -height * 0.1, 0]}>
          <boxGeometry args={[0.02, height * 0.8, front * 1.2]} />
          <meshStandardMaterial color={carConfig.secondaryColor} metalness={0.8} />
        </mesh>
        
        {/* Accent stripe */}
        <mesh position={[0, height * 0.1, 0]}>
          <boxGeometry args={[width * 0.3, 0.01, front * 1.8]} />
          <meshStandardMaterial color={carConfig.accentColor} />
        </mesh>
      </group>

      {/* Wheels - properly connected with rims, vertical orientation for forward rotation */}
      {wheels.map((wheelRef, index) => (
          <group key={index} ref={wheelRef}>
            {/* Tire - vertical cylinder that rotates around Y-axis when car moves forward */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[wheelRadius, wheelRadius, 0.03, 16]} />
              <meshStandardMaterial color="#1a1a1a" roughness={0.9} />
            </mesh>
            {/* Rim */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[wheelRadius * 0.6, wheelRadius * 0.6, 0.04, 16]} />
              <meshStandardMaterial 
                color={carConfig.accentColor} 
                metalness={0.9} 
                roughness={0.2} 
              />
            </mesh>
            {/* Wheel center cap */}
            <mesh position={[0, 0, 0]}>
              <cylinderGeometry args={[wheelRadius * 0.3, wheelRadius * 0.3, 0.05, 8]} />
              <meshStandardMaterial color={carConfig.bodyColor} metalness={0.8} />
            </mesh>
          </group>
      ))}
    </group>
  );
}

