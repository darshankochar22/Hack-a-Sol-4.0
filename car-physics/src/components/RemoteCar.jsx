import { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Quaternion, Vector3 } from "three";

export function RemoteCar({ playerId, position, rotation, speed }) {
  const meshRef = useRef(null);
  const defaultPosition = position && Array.isArray(position) && position.length >= 3 
    ? position 
    : [0, 0.3, 0];
  const defaultRotation = rotation && typeof rotation === 'object'
    ? rotation
    : { x: 0, y: 0, z: 0, w: 1 };
  
  const targetPositionRef = useRef(new Vector3(...defaultPosition));
  const targetRotationRef = useRef(
    new Quaternion(defaultRotation.x, defaultRotation.y, defaultRotation.z, defaultRotation.w)
  );

  // Update target position and rotation when props change
  useEffect(() => {
    if (meshRef.current && position) {
      targetPositionRef.current.set(position[0], position[1], position[2]);
    }
  }, [position]);

  useEffect(() => {
    if (meshRef.current && rotation) {
      targetRotationRef.current.set(
        rotation.x,
        rotation.y,
        rotation.z,
        rotation.w
      );
    }
  }, [rotation]);

  // Smooth interpolation to target position and rotation
  useFrame(() => {
    if (!meshRef.current) return;

    // Interpolate position (smooth movement)
    meshRef.current.position.lerp(targetPositionRef.current, 0.2);

    // Interpolate rotation (smooth rotation)
    meshRef.current.quaternion.slerp(targetRotationRef.current, 0.2);
  });

  // Different colors for different players
  const colors = [
    "#FF0000", // Red
    "#0000FF", // Blue
    "#00FF00", // Green
    "#FFFF00", // Yellow
    "#FF00FF", // Magenta
    "#00FFFF", // Cyan
    "#FFA500", // Orange
    "#800080", // Purple
  ];
  // Generate color index from playerId string
  const colorIndex = playerId
    ? playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    : 0;
  const carColor = colors[colorIndex];

  return (
    <group ref={meshRef} name={`remote-car-${playerId}`}>
      {/* Car body */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[0.12, 0.06, 0.24]} />
        <meshStandardMaterial
          color={carColor}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Car details */}
      <mesh position={[0, 0.02, 0.08]}>
        <boxGeometry args={[0.096, 0.02, 0.05]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* Driver cockpit */}
      <mesh position={[0, 0.01, -0.02]}>
        <boxGeometry args={[0.072, 0.03, 0.08]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Simple wheels */}
      {[
        [-0.08, -0.03, 0.08],
        [0.08, -0.03, 0.08],
        [-0.08, -0.03, -0.08],
        [0.08, -0.03, -0.08],
      ].map((wheelPos, index) => (
        <mesh key={index} position={wheelPos}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 16]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
      ))}

      {/* Speed indicator above car */}
      {speed > 0 && (
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.4, 0.06, 0.01]} />
          <meshBasicMaterial color="black" transparent opacity={0.8} />
        </mesh>
      )}
    </group>
  );
}

