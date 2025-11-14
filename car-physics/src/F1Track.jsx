import { usePlane } from "@react-three/cannon";
import { useRef } from "react";

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

      {/* Track boundaries - simple oval */}
      <TrackBoundary position={[0, 0.1, 0]} radius={15} />
      
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

function TrackBoundary({ position, radius }) {
  const segments = 32;
  const points = [];

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius * 0.6; // Oval shape
    points.push([x, 0, z]);
  }

  return (
    <>
      {/* Outer barrier */}
      {points.map((point, i) => {
        if (i === points.length - 1) return null;
        const nextPoint = points[i + 1];
        return (
          <mesh
            key={`outer-${i}`}
            position={[(point[0] + nextPoint[0]) / 2, 0.2, (point[2] + nextPoint[2]) / 2]}
          >
            <boxGeometry args={[0.2, 0.4, 0.5]} />
            <meshStandardMaterial color="#ff0000" />
          </mesh>
        );
      })}
      
      {/* Inner barrier */}
      {points.map((point, i) => {
        if (i === points.length - 1) return null;
        const nextPoint = points[i + 1];
        const innerRadius = radius * 0.7;
        const innerX = (point[0] / radius) * innerRadius;
        const innerZ = (point[2] / (radius * 0.6)) * (innerRadius * 0.6);
        const nextInnerX = (nextPoint[0] / radius) * innerRadius;
        const nextInnerZ = (nextPoint[2] / (radius * 0.6)) * (innerRadius * 0.6);
        return (
          <mesh
            key={`inner-${i}`}
            position={[(innerX + nextInnerX) / 2, 0.2, (innerZ + nextInnerZ) / 2]}
          >
            <boxGeometry args={[0.2, 0.4, 0.5]} />
            <meshStandardMaterial color="#ff0000" />
          </mesh>
        );
      })}
    </>
  );
}

