import { useBox, useRaycastVehicle } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import { useF1Wheels } from "../hooks/useF1Wheels";
import { carConfigs } from "../config/carConfigs";
import {
  generateTrackWaypoints,
  getClosestWaypointIndex,
  getNextWaypoint,
  getStartingPosition,
  getTrackProgress,
} from "../utils/trackPath";

/**
 * AI Bot Car - races automatically around the track
 */
export function F1BotCar({ 
  tokenId, 
  name, 
  aggressiveness = 50, 
  consistency = 50,
  onPositionUpdate,
  startOffset = 0, // Offset from start line for staggered starts
  carType = "mercedes"
}) {
  const carConfig = carConfigs[carType] || carConfigs.mercedes;
  
  // Track waypoints - shared across all bots
  const waypoints = useMemo(() => generateTrackWaypoints(64), []);
  
  // Start position on track with proper grid offset
  // Use tokenId to create unique starting positions side-by-side
  const position = useMemo(() => {
    // Use tokenId as grid position to space cars out
    const gridPos = tokenId ? (tokenId % 5) : 0; // Cycle through 0-4 for spacing
    return getStartingPosition(gridPos, 5);
  }, [tokenId]);

  // Calculate starting rotation to face track direction
  const rotation = useMemo(() => {
    const { getStartingRotation } = require("../utils/trackPath");
    return getStartingRotation();
  }, []);

  const width = 0.12;
  const height = 0.06;
  const front = 0.12;
  const wheelRadius = 0.04;

  const chassisBodyArgs = useMemo(() => [width, height, front * 2], [width, height, front]);
  const [chassisBody] = useBox(
    () => ({
      allowSleep: false,
      args: chassisBodyArgs,
      mass: 100,
      position,
      rotation, // Face the track direction at start
      // Add damping for smoother, more stable movement (prevents falling off)
      linearDamping: 0.4, // Reduces linear velocity over time (smoother movement)
      angularDamping: 0.4, // Reduces rotation velocity (prevents wobbling and falling)
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

  // AI Bot state
  const botStateRef = useRef({
    targetSpeed: 0.8 + (aggressiveness / 100) * 0.4, // 0.8 to 1.2 based on aggressiveness
    currentSpeed: 0,
    steeringAngle: 0,
    trackProgress: 0, // 0-1 around track
    lastUpdate: 0,
    currentWaypointIndex: 0,
    lookAheadDistance: 3 + (aggressiveness / 100) * 2, // More aggressive = look further ahead
    overtaking: false,
    overtakeTarget: null,
    lastOvertakeAttempt: 0,
  });

  const prevPositionRef = useRef(new Vector3(0, 0, 0));
  const positionVec = useMemo(() => new Vector3(), []);
  const quaternionVec = useMemo(() => new Quaternion(), []);

  // AI Bot control logic
  useFrame((state, delta) => {
    if (!chassisBody.current || !vehicleApi) return;

    const currentTime = Date.now();
    const botState = botStateRef.current;

    // Update position tracking
    positionVec.setFromMatrixPosition(chassisBody.current.matrixWorld);
    quaternionVec.setFromRotationMatrix(chassisBody.current.matrixWorld);

    // Calculate speed
    const distance = positionVec.distanceTo(prevPositionRef.current);
    botState.currentSpeed = distance / delta;
    prevPositionRef.current.copy(positionVec);

    // Find closest waypoint and update track progress
    const closestIndex = getClosestWaypointIndex(
      [positionVec.x, positionVec.y, positionVec.z],
      waypoints
    );
    botState.currentWaypointIndex = closestIndex;
    botState.trackProgress = getTrackProgress(closestIndex, waypoints.length);

    // Get next waypoint to steer towards (look ahead based on aggressiveness)
    const lookAhead = Math.round(botState.lookAheadDistance);
    const { waypoint: targetWaypoint } = getNextWaypoint(closestIndex, lookAhead, waypoints);

    // Calculate direction to target waypoint
    const directionToTarget = new Vector3()
      .subVectors(targetWaypoint, positionVec)
      .normalize();

    // Get current car direction (forward vector)
    const forward = new Vector3(0, 0, 1);
    forward.applyQuaternion(quaternionVec);
    forward.normalize();

    // Calculate steering angle to reach target waypoint
    const cross = new Vector3().crossVectors(forward, directionToTarget);
    const dot = forward.dot(directionToTarget);
    let steeringAngle = Math.atan2(cross.y, dot) * 2; // Multiply for more responsive steering

    // Overtaking logic - check if we should attempt to overtake
    if (currentTime - botState.lastOvertakeAttempt > 2000 && aggressiveness > 60) {
      // High aggressiveness bots try to overtake more often
      const shouldOvertake = Math.random() < (aggressiveness / 100) * 0.3;
      if (shouldOvertake) {
        botState.overtaking = true;
        botState.lastOvertakeAttempt = currentTime;
        // Adjust steering slightly to one side for overtaking
        const overtakeDirection = Math.random() > 0.5 ? 1 : -1;
        steeringAngle += overtakeDirection * 0.3 * (aggressiveness / 100);
      } else {
        botState.overtaking = false;
      }
    }

    // Clamp steering angle
    botState.steeringAngle = Math.max(-0.5, Math.min(0.5, steeringAngle));

    // Apply AI controls with overtaking boost
    const baseThrottle = Math.min(1, botState.targetSpeed / Math.max(0.1, botState.currentSpeed));
    const overtakeBoost = botState.overtaking ? 1.2 : 1.0; // 20% speed boost when overtaking
    const throttle = Math.min(1, baseThrottle * overtakeBoost);

    // Apply some randomness based on consistency
    const consistencyFactor = consistency / 100; // 0-1
    const randomSteer = (Math.random() - 0.5) * (1 - consistencyFactor) * 0.2;
    const randomThrottle = (Math.random() - 0.5) * (1 - consistencyFactor) * 0.15;
    
    // More aggressive bots have less randomness (more consistent)
    const aggressivenessFactor = aggressiveness / 100;
    const finalRandomSteer = randomSteer * (1 - aggressivenessFactor * 0.5);
    const finalRandomThrottle = randomThrottle * (1 - aggressivenessFactor * 0.5);

    // Calculate engine force with aggressiveness and overtaking boost
    const baseForce = 200 * (1 + aggressiveness / 200);
    const engineForce = (throttle + finalRandomThrottle) * baseForce * overtakeBoost;

    vehicleApi.applyEngineForce(engineForce, 2);
    vehicleApi.applyEngineForce(engineForce, 3);

    // Apply steering with consistency-based randomness
    const finalSteering = Math.max(-0.5, Math.min(0.5, botState.steeringAngle + finalRandomSteer));
    vehicleApi.setSteeringValue(finalSteering, 0);
    vehicleApi.setSteeringValue(finalSteering, 1);

    // Update position for telemetry (throttled)
    if (currentTime - botState.lastUpdate >= 100) {
      botState.lastUpdate = currentTime;
      
      if (onPositionUpdate) {
        const speedKmh = botState.currentSpeed * 10; // Convert to km/h
        onPositionUpdate({
          tokenId,
          name,
          position: [positionVec.x, positionVec.y, positionVec.z],
          speed: speedKmh,
          acceleration: 0,
          metrics: {
            trackProgress: botState.trackProgress,
            aggressiveness,
            consistency,
          },
        });
      }
    }
  });

  return (
    <group ref={vehicle} name={`bot-car-${tokenId}`}>
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
          <boxGeometry args={[width * 0.3, 0.02, 0.05]} />
          <meshStandardMaterial color={carConfig.details.nose} metalness={0.8} />
        </mesh>
      </group>

      {/* Wheels */}
      {wheels.map((wheel, index) => (
        <group key={index} ref={wheel}>
          <mesh>
            <cylinderGeometry args={[wheelRadius, wheelRadius, 0.05, 16]} />
            <meshStandardMaterial color="#1a1a1a" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

