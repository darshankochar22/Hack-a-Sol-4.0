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
 * @param {number} gridPosition - Position on starting grid (0 = pole, 1 = second, etc.)
 * @param {number} totalCars - Total number of cars
 */
export function getStartingPosition(gridPosition, totalCars = 5) {
  const { startLineZ, startLineX, trackWidth } = TRACK_CONFIG;

  // Stagger cars side by side on the grid
  const gridWidth = Math.min(trackWidth * 0.8, 3); // Max 3 units wide
  const offsetX =
    ((gridPosition - (totalCars - 1) / 2) / (totalCars - 1)) * gridWidth;

  // Slight forward offset for staggered start
  const offsetZ = gridPosition * 0.1;

  return [startLineX + offsetX, 0.3, startLineZ - offsetZ];
}

/**
 * Calculate track progress (0-1) based on waypoint index
 */
export function getTrackProgress(waypointIndex, totalWaypoints) {
  return waypointIndex / totalWaypoints;
}
