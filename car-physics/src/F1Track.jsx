import { usePlane } from "@react-three/cannon";
import { useRef, useMemo } from "react";
import { Vector3 } from "three";
import { TrackWalls } from "./components/TrackWalls";

// Track boundary component - creates white line boundaries with lanes
function TrackBoundary({ position, radius }) {
  const segments = 128; // More segments for smoother curves
  const lineHeight = 0.12; // Height of boundary lines
  const lineWidth = 0.15; // Width of boundary lines (thicker)
  const numLanes = 3; // Number of lanes

  // Create outer boundary line points
  const outerPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius * 0.6; // Oval shape
      points.push(new Vector3(x, lineHeight, z));
    }
    return points;
  }, [radius, segments]);

  // Create inner boundary line points
  const innerPoints = useMemo(() => {
    const innerRadius = radius * 0.65; // Larger track
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * innerRadius;
      const z = Math.sin(angle) * (innerRadius * 0.6); // Oval shape
      points.push(new Vector3(x, lineHeight, z));
    }
    return points;
  }, [radius, segments]);

  // Create lane marking points (dashed lines between lanes)
  const laneMarkings = useMemo(() => {
    const markings = [];
    const trackWidth = radius - radius * 0.65;
    const laneWidth = trackWidth / (numLanes + 1);

    for (let lane = 1; lane <= numLanes; lane++) {
      const laneRadius = radius * 0.65 + laneWidth * lane;
      const points = [];
      
      // Create dashed line pattern
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * laneRadius;
        const z = Math.sin(angle) * (laneRadius * 0.6);
        
        // Create dashed pattern (show line every 8 segments)
        if (i % 8 < 4) {
          points.push(new Vector3(x, lineHeight - 0.02, z));
        }
      }
      markings.push(points);
    }
    return markings;
  }, [radius, segments, numLanes]);


  return (
    <>
      {/* Outer boundary - thick white line */}
      <group>
        {outerPoints.map((point, i) => {
          if (i === outerPoints.length - 1) return null;
          const nextPoint = outerPoints[i + 1];
          const direction = new Vector3()
            .subVectors(nextPoint, point)
            .normalize();
          const midPoint = new Vector3()
            .addVectors(point, nextPoint)
            .multiplyScalar(0.5);

          return (
            <mesh
              key={`outer-${i}`}
              position={[midPoint.x, midPoint.y, midPoint.z]}
              rotation={[0, Math.atan2(direction.x, direction.z), 0]}
            >
              <boxGeometry args={[lineWidth, 0.02, direction.length() * 0.98]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          );
        })}
      </group>

      {/* Inner boundary - thick white line */}
      <group>
        {innerPoints.map((point, i) => {
          if (i === innerPoints.length - 1) return null;
          const nextPoint = innerPoints[i + 1];
          const direction = new Vector3()
            .subVectors(nextPoint, point)
            .normalize();
          const midPoint = new Vector3()
            .addVectors(point, nextPoint)
            .multiplyScalar(0.5);

          return (
            <mesh
              key={`inner-${i}`}
              position={[midPoint.x, midPoint.y, midPoint.z]}
              rotation={[0, Math.atan2(direction.x, direction.z), 0]}
            >
              <boxGeometry args={[lineWidth, 0.02, direction.length() * 0.98]} />
              <meshStandardMaterial color="#ffffff" />
            </mesh>
          );
        })}
      </group>

      {/* Lane markings - dashed white lines */}
      {laneMarkings.map((lanePoints, laneIndex) => (
        <group key={`lane-${laneIndex}`}>
          {lanePoints.map((point, i) => {
            if (i === lanePoints.length - 1 || i % 8 >= 4) return null;
            const nextPoint = lanePoints[i + 1];
            if (!nextPoint || (i + 1) % 8 >= 4) return null;
            
            const direction = new Vector3()
              .subVectors(nextPoint, point)
              .normalize();
            const midPoint = new Vector3()
              .addVectors(point, nextPoint)
              .multiplyScalar(0.5);

            return (
              <mesh
                key={`lane-${laneIndex}-${i}`}
                position={[midPoint.x, midPoint.y, midPoint.z]}
                rotation={[0, Math.atan2(direction.x, direction.z), 0]}
              >
                <boxGeometry args={[0.05, 0.01, direction.length() * 0.9]} />
                <meshStandardMaterial color="#ffffff" opacity={0.6} transparent />
              </mesh>
            );
          })}
        </group>
      ))}
    </>
  );
}

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

      {/* Track boundaries - multi-lane oval track */}
      <TrackBoundary position={[0, 0.1, 0]} radius={25} />
      
      {/* Physics walls - prevent cars from leaving the track */}
      <TrackWalls radius={25} />
      
      {/* Start/Finish line */}
      <mesh position={[0, 0.11, 25 * 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[8, 1]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0, 0.11, 25 * 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.5, 0.6]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
    </>
  );
}
