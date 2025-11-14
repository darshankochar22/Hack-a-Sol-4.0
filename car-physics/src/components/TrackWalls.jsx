import { useBox } from "@react-three/cannon";
import { useMemo } from "react";

// Track walls component - creates physics walls along track boundaries
export function TrackWalls({ radius }) {
  const segments = 128; // Match track boundary segments
  const wallHeight = 1.5; // Tall enough to prevent going over
  const wallThickness = 0.2; // Thickness of walls
  const innerRadius = radius * 0.65;
  
  // Start line is at z = radius * 0.6 = 15
  // Skip walls near the start line to allow entry/exit
  const startLineZ = radius * 0.6; // 15
  const skipZRange = 3; // Skip walls within ±3 units of start line z

  // Create outer wall segments (outside the track)
  const outerWalls = useMemo(() => {
    const walls = [];
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      const x1 = Math.cos(angle1) * radius;
      const z1 = Math.sin(angle1) * radius * 0.6;
      const x2 = Math.cos(angle2) * radius;
      const z2 = Math.sin(angle2) * radius * 0.6;

      // Skip walls near the start line (check both endpoints and midpoint)
      const midZ = (z1 + z2) / 2;
      const z1Near = Math.abs(z1 - startLineZ) < skipZRange;
      const z2Near = Math.abs(z2 - startLineZ) < skipZRange;
      const midZNear = Math.abs(midZ - startLineZ) < skipZRange;
      
      if (z1Near || z2Near || midZNear) continue;

      const midX = (x1 + x2) / 2;
      const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
      const rotation = Math.atan2(x2 - x1, z2 - z1);

      walls.push({
        position: [midX, wallHeight / 2, midZ],
        rotation: [0, rotation, 0],
        size: [wallThickness, wallHeight, length * 0.98],
      });
    }
    return walls;
  }, [radius, segments, startLineZ, skipZRange, wallHeight, wallThickness]);

  // Create inner wall segments (inside the track)
  const innerWalls = useMemo(() => {
    const walls = [];
    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2;
      const angle2 = ((i + 1) / segments) * Math.PI * 2;

      const x1 = Math.cos(angle1) * innerRadius;
      const z1 = Math.sin(angle1) * (innerRadius * 0.6);
      const x2 = Math.cos(angle2) * innerRadius;
      const z2 = Math.sin(angle2) * (innerRadius * 0.6);

      // Skip walls near the start line (check both endpoints and midpoint)
      const midZ = (z1 + z2) / 2;
      const z1Near = Math.abs(z1 - startLineZ) < skipZRange;
      const z2Near = Math.abs(z2 - startLineZ) < skipZRange;
      const midZNear = Math.abs(midZ - startLineZ) < skipZRange;
      
      if (z1Near || z2Near || midZNear) continue;

      const midX = (x1 + x2) / 2;
      const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
      const rotation = Math.atan2(x2 - x1, z2 - z1);

      walls.push({
        position: [midX, wallHeight / 2, midZ],
        rotation: [0, rotation, 0],
        size: [wallThickness, wallHeight, length * 0.98],
      });
    }
    return walls;
  }, [innerRadius, segments, startLineZ, skipZRange, wallHeight, wallThickness]);

  return (
    <>
      {/* Outer walls - prevent cars from going outside the track */}
      {outerWalls.map((wall, i) => (
        <TrackWall
          key={`outer-${i}`}
          position={wall.position}
          rotation={wall.rotation}
          size={wall.size}
        />
      ))}
      
      {/* Inner walls - prevent cars from going inside the track center */}
      {innerWalls.map((wall, i) => (
        <TrackWall
          key={`inner-${i}`}
          position={wall.position}
          rotation={wall.rotation}
          size={wall.size}
        />
      ))}
    </>
  );
}

// Individual wall segment component with physics
function TrackWall({ position, rotation, size }) {
  useBox(
    () => ({
      args: size,
      position,
      rotation,
      type: "Static",
      material: {
        friction: 0.4,
        restitution: 0.1, // Low bounce
      },
    }),
    null
  );

  // Optional: render visible walls for debugging (set to true to see walls)
  const debug = false;
  
  if (!debug) return null;

  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshBasicMaterial color="red" transparent opacity={0.3} />
    </mesh>
  );
}

