import { usePlane } from "@react-three/cannon";
import { useRef, useMemo } from "react";
import { Vector3 } from "three";

export function F1Track() {
  const [ref] = usePlane(
    () => ({
      type: "Static",
      rotation: [-Math.PI / 2, 0, 0],
    }),
    useRef(null)
  );

  return (
    <>
      {/* Track surface */}
      <mesh ref={ref} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>

      {/* Circular track with white border lines */}
      <CircularTrack radius={15} />
      
      {/* Start/Finish line */}
      <mesh position={[0, 0.11, 15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2, 0.5]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.11, 15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.8, 0.3]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
    </>
  );
}

function CircularTrack({ radius }) {
  const segments = 64; // More segments for smoother circle
  const trackWidth = radius * 0.3; // Width between inner and outer lines
  const lineHeight = 0.02; // Height of the white lines
  const lineWidth = 0.05; // Width of the white lines

  // Create outer circle points
  const outerPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius * 0.6; // Oval shape
      points.push(new Vector3(x, 0, z));
    }
    return points;
  }, [radius, segments]);

  // Create inner circle points
  const innerPoints = useMemo(() => {
    const innerRadius = radius - trackWidth;
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * innerRadius;
      const z = Math.sin(angle) * innerRadius * 0.6; // Oval shape
      points.push(new Vector3(x, 0, z));
    }
    return points;
  }, [radius, trackWidth, segments]);

  return (
    <>
      {/* Outer white border line */}
      {outerPoints.map((point, i) => {
        if (i === outerPoints.length - 1) return null;
        const nextPoint = outerPoints[i + 1];
        const midX = (point.x + nextPoint.x) / 2;
        const midZ = (point.z + nextPoint.z) / 2;
        const dx = nextPoint.x - point.x;
        const dz = nextPoint.z - point.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);

        return (
          <mesh
            key={`outer-line-${i}`}
            position={[midX, lineHeight / 2, midZ]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[lineWidth, lineHeight, length]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
          </mesh>
        );
      })}

      {/* Inner white border line */}
      {innerPoints.map((point, i) => {
        if (i === innerPoints.length - 1) return null;
        const nextPoint = innerPoints[i + 1];
        const midX = (point.x + nextPoint.x) / 2;
        const midZ = (point.z + nextPoint.z) / 2;
        const dx = nextPoint.x - point.x;
        const dz = nextPoint.z - point.z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);

        return (
          <mesh
            key={`inner-line-${i}`}
            position={[midX, lineHeight / 2, midZ]}
            rotation={[0, angle, 0]}
          >
            <boxGeometry args={[lineWidth, lineHeight, length]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.3} />
          </mesh>
        );
      })}

      {/* Track surface highlight (optional - lighter area between lines) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[radius - trackWidth, radius, segments]} />
        <meshStandardMaterial 
          color="#333333" 
          transparent 
          opacity={0.3}
        />
      </mesh>
    </>
  );
}

