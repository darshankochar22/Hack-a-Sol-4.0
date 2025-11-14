import { useBox, useRaycastVehicle } from "@react-three/cannon";
import { useFrame } from "@react-three/fiber";
import { useRef, useMemo, useCallback } from "react";
import { Quaternion, Vector3 } from "three";
import { useF1Wheels } from "../hooks/useF1Wheels";
import { carConfigs } from "../config/carConfigs";

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
  
  // Start position with offset for staggered grid
  const position = useMemo(() => {
    const offsetX = startOffset * 0.3; // Stagger cars side by side
    return [offsetX, 0.3, 14.5 - startOffset * 0.1]; // Slight forward offset too
  }, [startOffset]);

  const width = 0.12;
  const height = 0.06;
  const front = 0.12;
  const wheelRadius = 0.04;

  const chassisBodyArgs = useMemo(() => [width, height, front * 2], [width, height, front]);
  const [chassisBody, chassisApi] = useBox(
    () => ({
      allowSleep: false,
      args: chassisBodyArgs,
      mass: 100,
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

  // AI Bot state
  const botStateRef = useRef({
    targetSpeed: 0.8 + (aggressiveness / 100) * 0.4, // 0.8 to 1.2 based on aggressiveness
    currentSpeed: 0,
    steeringAngle: 0,
    trackProgress: 0, // 0-1 around track
    lastUpdate: 0,
  });

  const prevPositionRef = useRef(new Vector3(0, 0, 0));
  const positionVec = useMemo(() => new Vector3(), []);
  const quaternionVec = useMemo(() => new Quaternion(), []);

  // AI Bot control logic
  useFrame((state, delta) => {
    if (!chassisBody.current || !vehicleApi) return;

    const now = Date.now();
    const botState = botStateRef.current;

    // Update position tracking
    positionVec.setFromMatrixPosition(chassisBody.current.matrixWorld);
    quaternionVec.setFromRotationMatrix(chassisBody.current.matrixWorld);

    // Calculate speed
    const distance = positionVec.distanceTo(prevPositionRef.current);
    botState.currentSpeed = distance / delta;
    prevPositionRef.current.copy(positionVec);

    // Simple track following AI
    // Track is roughly a loop, we'll follow the z-axis forward
    const z = positionVec.z;
    const x = positionVec.x;

    // Calculate track progress (0-1)
    // Track goes from z=14.5 to z=-14.5 and back
    if (z > 14) {
      botState.trackProgress = 0.25 + (14.5 - z) / 60; // Top straight
    } else if (z < -14) {
      botState.trackProgress = 0.75 + (z + 14.5) / 60; // Bottom straight
    } else if (x > 0) {
      botState.trackProgress = 0.5 + (14.5 - z) / 60; // Right turn
    } else {
      botState.trackProgress = 0.25 - (z - 14.5) / 60; // Left turn
    }

    // AI steering - try to stay on track center (x=0)
    const targetX = 0;
    const xError = x - targetX;
    botState.steeringAngle = Math.max(-1, Math.min(1, xError * 2)); // Clamp steering

    // Apply AI controls
    const throttle = Math.min(1, botState.targetSpeed / Math.max(0.1, botState.currentSpeed));
    const brake = botState.currentSpeed > botState.targetSpeed * 1.1 ? 0.3 : 0;

    // Apply some randomness based on consistency
    const consistencyFactor = consistency / 100; // 0-1
    const randomSteer = (Math.random() - 0.5) * (1 - consistencyFactor) * 0.3;
    const randomThrottle = (Math.random() - 0.5) * (1 - consistencyFactor) * 0.2;

    vehicleApi.applyEngineForce(
      (throttle + randomThrottle) * 200 * (1 + aggressiveness / 200),
      2
    );
    vehicleApi.applyEngineForce(
      (throttle + randomThrottle) * 200 * (1 + aggressiveness / 200),
      3
    );

    vehicleApi.setSteeringValue(
      Math.max(-0.5, Math.min(0.5, botState.steeringAngle + randomSteer)),
      0
    );
    vehicleApi.setSteeringValue(
      Math.max(-0.5, Math.min(0.5, botState.steeringAngle + randomSteer)),
      1
    );

    // Update position for telemetry (throttled)
    if (now - botState.lastUpdate >= 100) {
      botState.lastUpdate = now;
      
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

