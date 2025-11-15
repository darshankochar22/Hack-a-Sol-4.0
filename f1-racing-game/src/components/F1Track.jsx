import { usePlane, useBox } from "@react-three/cannon";
import { useRef, useMemo } from "react";
import { Vector3 } from "three";
import { TRACK_CONFIG } from "../utils/trackPath";

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
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Off-road area (darker) */}
      <OffRoadArea />

      {/* Circular track with white border lines */}
      <CircularTrack radius={15} />
      
      {/* Track Fencing - Barriers to prevent going off-road */}
      <TrackFencing />
      
      {/* Enhanced Start/Finish line */}
      <StartFinishLine />
    </>
  );
}

// Off-road area visualization
function OffRoadArea() {
  const outerRadius = TRACK_CONFIG.outerRadius + 2; // Extend beyond track
  const innerRadius = TRACK_CONFIG.innerRadius - 2;
  const segments = 64;

  return (
    <>
      {/* Outer off-road ring */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[outerRadius, 25, segments]} />
        <meshStandardMaterial 
          color="#0a0a0a" 
          roughness={0.8}
        />
      </mesh>
      
      {/* Inner off-road area */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[innerRadius, segments]} />
        <meshStandardMaterial 
          color="#0a0a0a" 
          roughness={0.8}
        />
      </mesh>
    </>
  );
}

// Track fencing with physics barriers
function TrackFencing() {
  const segments = 32; // Reduced for better performance (still provides good coverage)
  const outerRadius = TRACK_CONFIG.outerRadius + 0.5; // Just outside track (15.5)
  const innerRadius = TRACK_CONFIG.innerRadius - 0.5; // Just inside track (10)
  const fenceHeight = 1.2; // Increased height to better prevent cars from going over
  const fenceThickness = 0.15; // Slightly thicker for better collision
  const zCompression = TRACK_CONFIG.zCompression;

  // Outer fence barriers (physics)
  const outerBarriers = useMemo(() => {
    const barriers = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * outerRadius;
      const z = Math.sin(angle) * outerRadius * zCompression;
      const nextAngle = ((i + 1) / segments) * Math.PI * 2;
      const nextX = Math.cos(nextAngle) * outerRadius;
      const nextZ = Math.sin(nextAngle) * outerRadius * zCompression;
      
      const midX = (x + nextX) / 2;
      const midZ = (z + nextZ) / 2;
      const dx = nextX - x;
      const dz = nextZ - z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angleY = Math.atan2(dx, dz);
      
      barriers.push({
        key: `outer-barrier-${i}`,
        position: [midX, fenceHeight / 2, midZ],
        rotation: [0, angleY, 0],
        length,
      });
    }
    return barriers;
  }, [segments, outerRadius, zCompression]);

  // Inner fence barriers (physics)
  const innerBarriers = useMemo(() => {
    const barriers = [];
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * innerRadius;
      const z = Math.sin(angle) * innerRadius * zCompression;
      const nextAngle = ((i + 1) / segments) * Math.PI * 2;
      const nextX = Math.cos(nextAngle) * innerRadius;
      const nextZ = Math.sin(nextAngle) * innerRadius * zCompression;
      
      const midX = (x + nextX) / 2;
      const midZ = (z + nextZ) / 2;
      const dx = nextX - x;
      const dz = nextZ - z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angleY = Math.atan2(dx, dz);
      
      barriers.push({
        key: `inner-barrier-${i}`,
        position: [midX, fenceHeight / 2, midZ],
        rotation: [0, angleY, 0],
        length,
      });
    }
    return barriers;
  }, [segments, innerRadius, zCompression]);

  return (
    <>
      {/* Outer fence barriers with physics */}
      {outerBarriers.map((barrier) => (
        <FenceBarrier
          key={barrier.key}
          position={barrier.position}
          rotation={barrier.rotation}
          length={barrier.length}
          height={fenceHeight}
          thickness={fenceThickness}
        />
      ))}
      
      {/* Inner fence barriers with physics */}
      {innerBarriers.map((barrier) => (
        <FenceBarrier
          key={barrier.key}
          position={barrier.position}
          rotation={barrier.rotation}
          length={barrier.length}
          height={fenceHeight}
          thickness={fenceThickness}
        />
      ))}
    </>
  );
}

// Individual fence barrier with physics
function FenceBarrier({ position, rotation, length, height, thickness }) {
  const [ref] = useBox(
    () => ({
      type: "Static",
      args: [thickness, height, length],
      position,
      rotation,
    }),
    useRef(null)
  );

  return (
    <mesh ref={ref} castShadow receiveShadow>
      <boxGeometry args={[thickness, height, length]} />
      <meshStandardMaterial 
        color="#ff0000" 
        metalness={0.3}
        roughness={0.4}
        emissive="#ff0000"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

// Enhanced Start/Finish line with proper checkered pattern - ONLY between red walls
// Perpendicular to track direction
function StartFinishLine() {
  const { startLineX, innerRadius, outerRadius, zCompression } = TRACK_CONFIG;
  
  // Barrier positions - these define the red walls
  const outerBarrier = outerRadius + 0.5; // 15.5 (outer red wall)
  const innerBarrier = innerRadius - 0.5;  // 10 (inner red wall)
  
  // Calculate valid z position where barriers exist (same as in getStartingPosition)
  const centerRadius = (outerBarrier + innerBarrier) / 2; // 12.75
  const maxZAtCenter = centerRadius * zCompression; // 12.75 * 0.6 = 7.65
  const validZ = maxZAtCenter; // Use maximum valid z where barriers exist
  
  // Get track direction at start line to calculate perpendicular rotation
  const { generateTrackWaypoints } = require("../utils/trackPath");
  const waypoints = generateTrackWaypoints(64);
  
  // Find the waypoint at the start line position
  let closestWaypoint = waypoints[0];
  let closestIndex = 0;
  let minDistance = Infinity;
  
  waypoints.forEach((wp, i) => {
    const distance = Math.abs(wp.z - validZ);
    if (distance < minDistance) {
      minDistance = distance;
      closestWaypoint = wp;
      closestIndex = i;
    }
  });
  
  // Get the next waypoint to determine track direction
  const nextIndex = (closestIndex + 1) % waypoints.length;
  const nextWaypoint = waypoints[nextIndex];
  
  // Calculate track direction vector
  const trackDirection = new Vector3()
    .subVectors(nextWaypoint, closestWaypoint)
    .normalize();
  
  // Calculate rotation angle to align checkered line perpendicular to track direction
  // The checkered line should be perpendicular to the track direction (90 degrees from track direction)
  // Track direction angle: Math.atan2(trackDirection.x, trackDirection.z)
  // Perpendicular angle: trackDirectionAngle + Math.PI/2 (90 degrees clockwise from track direction)
  const trackDirectionAngle = Math.atan2(trackDirection.x, trackDirection.z);
  const perpendicularAngle = trackDirectionAngle + Math.PI / 2; // 90 degrees perpendicular to track direction
  
  // Calculate perpendicular direction vector (for positioning squares)
  const perpendicularDir = new Vector3(-trackDirection.z, 0, trackDirection.x).normalize();
  
  // Calculate actual barrier positions at start line
  // Barriers are at distances innerBarrier and outerBarrier from center
  // At start line, position is at closestWaypoint
  const baseX = closestWaypoint.x;
  const baseZ = closestWaypoint.z;
  
  // Calculate track width between barriers along perpendicular direction
  const trackWidth = outerBarrier - innerBarrier; // 5.5 units
  const lineWidth = trackWidth; // Checkered line spans full width between barriers
  
  const lineHeight = 0.12;
  const actualSquareSize = lineWidth / 8; // 8 squares across the track width
  const lineDepth = 0.5; // Depth of the checkered line
  
  return (
    <group position={[0, 0, 0]}>
      {/* Checkered pattern - proper chess board style - ONLY between red walls */}
      {/* Create 8x2 grid of squares (8 across track width, 2 deep along track) */}
      {/* Squares are laid out perpendicular to track direction */}
      {Array.from({ length: 8 }).map((_, col) => {
        return Array.from({ length: 2 }).map((_, row) => {
          // Position squares along the perpendicular direction (across track width)
          // Start from inner barrier, span to outer barrier
          const offsetFromInner = (col + 0.5) * actualSquareSize;
          const offsetAlongPerpendicular = -trackWidth / 2 + offsetFromInner; // Center at 0, span from -width/2 to +width/2
          const offsetAlongTrack = (row - 0.5) * lineDepth;
          
          // Position: start from waypoint position, move along perpendicular direction
          const x = baseX + offsetAlongPerpendicular * perpendicularDir.x + offsetAlongTrack * trackDirection.x;
          const z = baseZ + offsetAlongPerpendicular * perpendicularDir.z + offsetAlongTrack * trackDirection.z;
          
          // Alternate pattern: black if (col + row) is even
          const isBlack = (col + row) % 2 === 0;
          
          // Calculate rotation to align square with track (perpendicular to track direction)
          const squareRotationY = perpendicularAngle;
          
          return (
            <mesh
              key={`checker-${col}-${row}`}
              position={[x, lineHeight / 2 + 0.01, z]}
              rotation={[-Math.PI / 2, squareRotationY, 0]}
            >
              <planeGeometry args={[actualSquareSize * 0.98, lineDepth * 0.98]} />
              <meshStandardMaterial 
                color={isBlack ? "#000000" : "#ffffff"}
                emissive={isBlack ? "#000000" : "#ffffff"}
                emissiveIntensity={isBlack ? 0.1 : 0.3}
              />
            </mesh>
          );
        });
      })}
    </group>
  );
}

function CircularTrack({ radius }) {
  const segments = 64; // More segments for smoother circle
  
  // Use barrier positions to define track boundaries (between red walls)
  const outerBarrier = TRACK_CONFIG.outerRadius + 0.5; // 15.5 (outer red wall)
  const innerBarrier = TRACK_CONFIG.innerRadius - 0.5;  // 10 (inner red wall)
  
  // Track width is exactly between barriers
  const trackWidth = outerBarrier - innerBarrier; // 5.5 units
  const centerRadius = (outerBarrier + innerBarrier) / 2; // 12.75 (center between walls)
  
  const lineHeight = 0.02; // Height of the white lines
  const lineWidth = 0.05; // Width of the white lines

  // Create outer circle points - at outer barrier position
  const outerPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * outerBarrier;
      const z = Math.sin(angle) * outerBarrier * TRACK_CONFIG.zCompression; // Oval shape
      points.push(new Vector3(x, 0, z));
    }
    return points;
  }, [outerBarrier, segments]);

  // Create inner circle points - at inner barrier position
  const innerPoints = useMemo(() => {
    const points = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const x = Math.cos(angle) * innerBarrier;
      const z = Math.sin(angle) * innerBarrier * TRACK_CONFIG.zCompression; // Oval shape
      points.push(new Vector3(x, 0, z));
    }
    return points;
  }, [innerBarrier, segments]);

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

      {/* Track surface highlight - ONLY between red walls */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[innerBarrier, outerBarrier, segments]} />
        <meshStandardMaterial 
          color="#333333" 
          transparent 
          opacity={0.3}
        />
      </mesh>

      {/* Center line (dashed yellow line for reference) - between walls */}
      {Array.from({ length: segments }).map((_, i) => {
        if (i % 4 !== 0) return null; // Dashed line - show every 4th segment
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.cos(angle) * centerRadius;
        const z = Math.sin(angle) * centerRadius * TRACK_CONFIG.zCompression;
        const nextAngle = ((i + 1) / segments) * Math.PI * 2;
        const nextX = Math.cos(nextAngle) * centerRadius;
        const nextZ = Math.sin(nextAngle) * centerRadius * TRACK_CONFIG.zCompression;
        const dx = nextX - x;
        const dz = nextZ - z;
        const length = Math.sqrt(dx * dx + dz * dz);
        const lineAngle = Math.atan2(dx, dz);

        return (
          <mesh
            key={`center-line-${i}`}
            position={[(x + nextX) / 2, 0.015, (z + nextZ) / 2]}
            rotation={[0, lineAngle, 0]}
          >
            <boxGeometry args={[0.02, 0.01, length * 0.8]} />
            <meshStandardMaterial color="#ffff00" emissive="#ffff00" emissiveIntensity={0.5} />
          </mesh>
        );
      })}
    </>
  );
}

