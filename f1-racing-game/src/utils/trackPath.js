import { Vector3 } from "three";

/**
 * Track Configuration
 *
 * Track Dimensions:
 * - Outer Radius: 15 units
 * - Inner Radius: 10.5 units
 * - Track Width: 4.5 units
 * - Center Line Radius: ~12.75 units (middle of track)
 * - Start/Finish Line: z=15, x=0
 * - Track is an oval shape (compressed circle with 0.6 ratio on z-axis)
 */
export const TRACK_CONFIG = {
  outerRadius: 15,
  innerRadius: 10.5,
  trackWidth: 4.5,
  centerRadius: 12.75, // Middle of track
  zCompression: 0.6, // Oval compression factor
  startLineZ: 15,
  startLineX: 0,
};

/**
 * Generate waypoints for the track center line
 * Returns array of Vector3 points that cars should follow
 */
export function generateTrackWaypoints(segments = 64) {
  const waypoints = [];
  const { centerRadius, zCompression } = TRACK_CONFIG;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * centerRadius;
    const z = Math.sin(angle) * centerRadius * zCompression;
    waypoints.push(new Vector3(x, 0, z));
  }

  return waypoints;
}

/**
 * Get the closest waypoint index to a given position
 */
export function getClosestWaypointIndex(position, waypoints) {
  let closestIndex = 0;
  let minDistance = Infinity;
  const pos = new Vector3(position[0], position[1], position[2]);

  waypoints.forEach((waypoint, index) => {
    const distance = pos.distanceTo(waypoint);
    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = index;
    }
  });

  return closestIndex;
}

/**
 * Get the next waypoint ahead on the track
 * @param {number} currentIndex - Current waypoint index
 * @param {number} lookAhead - How many waypoints ahead to look (default 3)
 * @param {Array} waypoints - Array of waypoints
 */
export function getNextWaypoint(currentIndex, lookAhead = 3, waypoints) {
  const nextIndex = (currentIndex + lookAhead) % waypoints.length;
  return {
    waypoint: waypoints[nextIndex],
    index: nextIndex,
    progress: currentIndex / waypoints.length, // 0-1 track progress
  };
}

/**
 * Calculate steering angle to reach target waypoint
 * @param {Vector3} currentPos - Current car position
 * @param {Vector3} targetWaypoint - Target waypoint to steer towards
 * @param {Vector3} currentDirection - Current car direction (forward vector)
 */
export function calculateSteeringAngle(
  currentPos,
  targetWaypoint,
  currentDirection
) {
  const directionToTarget = new Vector3()
    .subVectors(targetWaypoint, currentPos)
    .normalize();

  // Calculate angle between current direction and target direction
  const dot = currentDirection.dot(directionToTarget);
  const cross = new Vector3().crossVectors(currentDirection, directionToTarget);

  // Steering angle: positive = right, negative = left
  const steeringAngle = Math.atan2(cross.y, dot);

  return Math.max(-0.5, Math.min(0.5, steeringAngle * 2)); // Clamp to reasonable range
}

/**
 * Get starting position on track with offset for grid position
 * Positions cars perpendicular to track direction (side-by-side)
 * @param {number} gridPosition - Position on starting grid (0 = pole, 1 = second, etc.)
 * @param {number} totalCars - Total number of cars
 */
export function getStartingPosition(gridPosition, totalCars = 5) {
  const { startLineX, innerRadius, outerRadius, zCompression } = TRACK_CONFIG;

  // Barrier positions: outer at outerRadius + 0.5, inner at innerRadius - 0.5
  const outerBarrier = outerRadius + 0.5; // 15.5
  const innerBarrier = innerRadius - 0.5;  // 10
  
  // Find the waypoint at the start line to get track direction
  const centerRadius = (outerBarrier + innerBarrier) / 2; // 12.75
  const maxZAtCenter = centerRadius * zCompression; // 12.75 * 0.6 = 7.65
  const validZ = maxZAtCenter; // ~7.65, maximum z where barriers exist
  
  // Get waypoints to calculate track direction
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
  
  // Calculate perpendicular direction (for positioning cars side-by-side)
  const perpendicularDir = new Vector3(-trackDirection.z, 0, trackDirection.x).normalize();
  
  // At this z position, calculate the actual positions of barriers along the perpendicular direction
  // The barriers form a circle/oval, so we need to find where they intersect the perpendicular line
  // For oval: (x/r)^2 + (z/(r*zCompression))^2 = 1
  // At z=validZ, find x positions
  const zScaledValid = validZ / zCompression; // 7.65 / 0.6 = 12.75
  
  // Calculate distance from center to barriers along perpendicular direction
  // At the start line, the perpendicular direction goes through the center
  // Distance to outer barrier: outerBarrier
  // Distance to inner barrier: innerBarrier
  const distanceToOuter = outerBarrier;
  const distanceToInner = innerBarrier;
  const trackWidth = distanceToOuter - distanceToInner; // 5.5 units
  
  // Use conservative safe width (leave margins from barriers)
  const safeWidth = trackWidth * 0.8; // Use 80% of available width for safety
  const spacing = Math.min(0.4, safeWidth / (totalCars + 1));
  
  // Position cars along perpendicular direction (side-by-side)
  // gridPosition 0 -> center
  // gridPosition 1, 2, 3... -> offset along perpendicular direction
  const offsetAlongPerpendicular = gridPosition === 0 ? 0 : (gridPosition - (totalCars - 1) / 2) * spacing;
  
  // Clamp to ensure car stays well between barriers
  const maxOffset = safeWidth / 2 - 0.15; // Leave 0.15 margin from barriers
  const minOffset = -maxOffset;
  const clampedOffset = Math.max(minOffset, Math.min(maxOffset, offsetAlongPerpendicular));
  
  // Calculate final position: start from waypoint position, move along perpendicular direction
  const baseX = closestWaypoint.x;
  const baseZ = closestWaypoint.z;
  
  const finalX = baseX + clampedOffset * perpendicularDir.x;
  const finalZ = baseZ + clampedOffset * perpendicularDir.z;

  // Ensure cars are on the track surface (y=0.3 is correct for car height)
  return [finalX, 0.3, finalZ];
}

/**
 * Calculate track progress (0-1) based on waypoint index
 */
export function getTrackProgress(waypointIndex, totalWaypoints) {
  return waypointIndex / totalWaypoints;
}

/**
 * Get starting rotation to face the track direction
 * Returns rotation in radians (Euler angles: [x, y, z])
 * Cars should face the direction of the track at the start line
 */
export function getStartingRotation() {
  const { centerRadius, zCompression } = TRACK_CONFIG;
  
  // Find the waypoint at the start line position (top of oval, z=max)
  const maxZ = centerRadius * zCompression; // 7.65
  const waypoints = generateTrackWaypoints(64);
  
  // Find the waypoint closest to z=maxZ (start line)
  let closestWaypoint = waypoints[0];
  let closestIndex = 0;
  let minDistance = Infinity;
  
  waypoints.forEach((wp, i) => {
    const distance = Math.abs(wp.z - maxZ);
    if (distance < minDistance) {
      minDistance = distance;
      closestWaypoint = wp;
      closestIndex = i;
    }
  });
  
  // Get the next waypoint to determine track direction
  const nextIndex = (closestIndex + 1) % waypoints.length;
  const nextWaypoint = waypoints[nextIndex];
  
  // Calculate direction vector (from current to next waypoint)
  const direction = new Vector3()
    .subVectors(nextWaypoint, closestWaypoint)
    .normalize();
  
  // Calculate rotation angle (yaw) to face this direction
  // At the top of the oval, track goes horizontally (x direction)
  // Rotation around Y axis to face the direction
  // Note: Car model forward is along +Z, so we use atan2(x, z) to get the correct angle
  // If cars are facing opposite, we may need to add Math.PI (180 degrees)
  let angleY = Math.atan2(direction.x, direction.z);
  
  // If cars are facing the wrong direction, flip by 180 degrees
  // This ensures cars face forward along the track direction
  angleY = angleY + Math.PI; // Add 180 degrees to face the correct direction
  
  // Return rotation as [x, y, z] Euler angles (in radians)
  // Only Y rotation (yaw) is needed for horizontal track alignment
  return [0, angleY, 0];
}
