# F1 Racing Track System Documentation

## Track Dimensions

The track is an **oval-shaped circuit** with the following specifications:

### Core Dimensions

- **Outer Radius**: 15 units
- **Inner Radius**: 10.5 units
- **Track Width**: 4.5 units (30% of outer radius)
- **Center Line Radius**: 12.75 units (middle of track)
- **Z-Axis Compression**: 0.6 (makes it an oval, not a perfect circle)
- **Start/Finish Line**: Located at `z=15`, `x=0`

### Visual Elements

- **White Border Lines**: Inner and outer track boundaries
- **Yellow Center Line**: Dashed line showing the ideal racing line (every 4th segment)
- **Track Surface**: Dark gray (#2a2a2a) with lighter highlight between lines

## Track Path System

### Waypoint-Based Navigation

All cars (player and bots) follow a **shared waypoint system** that defines the ideal racing line:

- **64 waypoints** distributed evenly around the track
- Each waypoint is a `Vector3` position on the center line
- Cars find their closest waypoint and steer towards the next waypoint ahead

### Starting Positions

Cars start in a **staggered grid formation** on the start line:

- **Player Car**: Pole position (grid position 0)
- **Bot Cars**: Positions 1, 2, 3, 4... (staggered side-by-side)
- Grid width: Maximum 3 units (80% of track width)
- Forward offset: 0.1 units per grid position for staggered start

## AI Bot Behavior

### Path Following

- All bots follow the **same waypoint path** (center line)
- Each bot finds its closest waypoint and looks ahead 3-5 waypoints (based on aggressiveness)
- Steering is calculated to reach the target waypoint

### Overtaking System

Bots can overtake each other based on:

1. **Aggressiveness** (40-70):

   - Higher aggressiveness = more likely to attempt overtakes
   - More aggressive bots look further ahead (3-5 waypoints)
   - Overtake probability: `(aggressiveness / 100) * 0.3`
   - Overtake attempts every 2+ seconds

2. **Overtaking Mechanics**:

   - When overtaking, bot gets **20% speed boost**
   - Steering adjusts randomly left or right
   - Steering adjustment: `0.3 * (aggressiveness / 100)`

3. **Consistency** (50-65):
   - Higher consistency = less randomness in steering/throttle
   - More consistent bots follow the racing line more precisely
   - Randomness factor: `(1 - consistencyFactor) * 0.2`

### Speed Control

- **Target Speed**: `0.8 + (aggressiveness / 100) * 0.4` (0.8 to 1.2 units/sec)
- **Engine Force**: `200 * (1 + aggressiveness / 200)` (200 to 300)
- **Overtake Boost**: 1.2x multiplier when actively overtaking

## Technical Implementation

### Files

- `src/utils/trackPath.js`: Track waypoint generation and path utilities
- `src/components/F1Track.jsx`: Visual track rendering
- `src/components/F1BotCar.jsx`: AI bot car with waypoint following
- `src/components/F1Car.jsx`: Player car (also uses waypoints in AI mode)

### Key Functions

- `generateTrackWaypoints(segments)`: Creates waypoint array
- `getClosestWaypointIndex(position, waypoints)`: Finds nearest waypoint
- `getNextWaypoint(currentIndex, lookAhead, waypoints)`: Gets target waypoint
- `getStartingPosition(gridPosition, totalCars)`: Calculates grid start position
- `getTrackProgress(waypointIndex, totalWaypoints)`: Returns 0-1 progress

## Race Flow

1. **Race Start**: All cars spawn on start line in staggered grid
2. **Path Following**: Each car finds closest waypoint and steers to next waypoint
3. **Overtaking**: High-aggressiveness bots randomly attempt overtakes
4. **Position Tracking**: Cars are sorted by distance traveled for live standings
5. **Race End**: After 60 seconds, final positions and points are calculated

## Notes

- All cars follow the **same path** (center line waypoints)
- Overtaking is **random** but influenced by aggressiveness
- More aggressive bots are **faster** and **more likely to overtake**
- More consistent bots have **less randomness** in their driving
- The track is a **closed loop** - waypoints wrap around (modulo 64)
