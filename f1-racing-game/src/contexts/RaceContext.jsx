import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { racingApi } from "../utils/racingApi";

const RaceContext = createContext(null);

const RACE_DURATION = 60; // 60 seconds

export function RaceProvider({ children }) {
  const [isRaceActive, setIsRaceActive] = useState(false);
  const [selectedCar, setSelectedCar] = useState(null);
  const [raceTime, setRaceTime] = useState(0); // Time elapsed in seconds
  const [speed, setSpeed] = useState(0);
  const [activeRaceId, setActiveRaceId] = useState(null);
  const [currentTokenId, setCurrentTokenId] = useState(null);
  const [competitors, setCompetitors] = useState([]); // All cars in race
  const [raceStartTime, setRaceStartTime] = useState(null);
  const lastTelemetryUpdate = useRef(0);
  const raceTimerRef = useRef(null);
  const lapCountRef = useRef({}); // Track laps completed by each car
  const TELEMETRY_UPDATE_INTERVAL = 2000; // Update every 2 seconds
  const carDistanceRef = useRef({}); // Track cumulative distance for each car
  const carPreviousPositionRef = useRef({}); // Track previous position for each car

  // Calculate points based on position (F1 style: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1)
  const calculatePoints = useCallback((position, totalCompetitors) => {
    const pointsTable = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    if (position <= pointsTable.length) {
      return pointsTable[position - 1];
    }
    return 0;
  }, []);

  // End race manually, when time expires, or when all cars complete 1 lap
  const endRace = useCallback(() => {
    setIsRaceActive(false);
    if (raceTimerRef.current) {
      clearInterval(raceTimerRef.current);
      raceTimerRef.current = null;
    }
    
    // Calculate final positions and points
    setCompetitors((prevCompetitors) => {
      const sortedCompetitors = [...prevCompetitors].sort((a, b) => {
        // Sort by laps first (more laps = better), then by distance
        if (b.laps !== a.laps) {
          return b.laps - a.laps;
        }
        return b.distance - a.distance;
      });
      const updatedCompetitors = sortedCompetitors.map((comp, idx) => ({
        ...comp,
        position: idx + 1,
        points: calculatePoints(idx + 1, prevCompetitors.length),
      }));
      console.log("🏁 Race ended. Final standings:", updatedCompetitors);
      return updatedCompetitors;
    });
  }, [calculatePoints]);

  // Start race
  const startRace = useCallback((raceId, tokenId, carType, competitorsList = []) => {
    setIsRaceActive(true);
    setActiveRaceId(raceId);
    setCurrentTokenId(tokenId);
    setSelectedCar(carType);
    setRaceTime(0);
    setSpeed(0);
    setRaceStartTime(Date.now());
    
    // Reset distance tracking for all cars
    carDistanceRef.current = {};
    carPreviousPositionRef.current = {};
    
    // Initialize competitors (player + bots)
    const allCompetitors = [
      {
        tokenId,
        name: `Car #${tokenId}`,
        isPlayer: true,
        speed: 0,
        distance: 0,
        laps: 0,
        position: 1,
        time: 0,
        carType,
        aggressiveness: 55, // Player car stats
        consistency: 60,
      },
      ...competitorsList.map((comp, idx) => ({
        tokenId: comp.tokenId || 10001 + idx,
        name: comp.name || `Bot #${comp.tokenId || 10001 + idx}`,
        isPlayer: false,
        speed: 0,
        distance: 0,
        laps: 0,
        position: idx + 2,
        time: 0,
        aggressiveness: comp.aggressiveness || 50,
        consistency: comp.consistency || 50,
        carType: comp.carType || "mercedes",
      })),
    ];
    setCompetitors(allCompetitors);
    
    // Start race timer
    raceTimerRef.current = setInterval(() => {
      setRaceTime((prev) => {
        const newTime = prev + 1;
        if (newTime >= RACE_DURATION) {
          endRace();
          return RACE_DURATION;
        }
        return newTime;
      });
    }, 1000);
    
    console.log("🏁 Race started:", { raceId, tokenId, carType, competitors: allCompetitors.length });
  }, [endRace]);

  // Calculate distance traveled (cumulative distance tracking)
  // Based on car-physics approach: track position from chassis body matrixWorld
  const calculateDistance = useCallback((tokenId, position, speed) => {
    // Ensure position is an array with 3 elements (x, y, z)
    const currentPos = Array.isArray(position) && position.length >= 3 
      ? [position[0] || 0, position[1] || 0, position[2] || 0]
      : [0, 0, 0];
    
    // Initialize if first time (like car-physics initializes position)
    if (!carDistanceRef.current[tokenId]) {
      carDistanceRef.current[tokenId] = 0;
      carPreviousPositionRef.current[tokenId] = [...currentPos];
      return 0;
    }
    
    const prevPos = carPreviousPositionRef.current[tokenId];
    
    // Ensure prevPos is valid
    if (!Array.isArray(prevPos) || prevPos.length < 3) {
      carPreviousPositionRef.current[tokenId] = [...currentPos];
      return carDistanceRef.current[tokenId] || 0;
    }
    
    // Calculate 3D Euclidean distance moved (like car-physics uses Vector3.distanceTo)
    // This is the actual distance the car traveled in 3D space
    const dx = currentPos[0] - prevPos[0];
    const dy = currentPos[1] - prevPos[1];
    const dz = currentPos[2] - prevPos[2];
    const distanceMoved = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Accumulate distance - track all movement (similar to car-physics position tracking)
    // This gives us the total distance traveled by the car
    // Always update previous position, but only accumulate if there's actual movement
    if (distanceMoved > 0.001) { // Small threshold to avoid floating point errors
      carDistanceRef.current[tokenId] = (carDistanceRef.current[tokenId] || 0) + distanceMoved;
    }
    carPreviousPositionRef.current[tokenId] = [...currentPos];
    
    // Return cumulative distance traveled (total distance the car has moved)
    const totalDistance = carDistanceRef.current[tokenId] || 0;
    
    // Debug logging (can be removed later)
    if (totalDistance > 0 && Math.random() < 0.01) { // Log 1% of updates
      console.log(`Distance for car ${tokenId}:`, totalDistance.toFixed(2));
    }
    
    return totalDistance;
  }, []);

  // Handle lap completion
  const handleLapComplete = useCallback((data) => {
    const { tokenId, lap } = data;
    lapCountRef.current[tokenId] = lap;
    
    setCompetitors((prev) => {
      return prev.map((comp) => {
        if (comp.tokenId === tokenId) {
          return {
            ...comp,
            laps: lap,
          };
        }
        return comp;
      });
    });
    
    // Check if all cars completed 1 lap
    setCompetitors((prev) => {
      const allCompleted = prev.every(comp => (lapCountRef.current[comp.tokenId] || 0) >= 1);
      if (allCompleted && prev.length > 0) {
        console.log("🏁 All cars completed 1 lap! Race finished.");
        setTimeout(() => endRace(), 1000); // End race after 1 second
      }
      return prev;
    });
  }, [endRace]);

  // Update competitor data (called from racing scene for all cars)
  const updateCompetitor = useCallback((data) => {
    if (!isRaceActive) return;

    setCompetitors((prev) => {
      const updated = prev.map((comp) => {
        if (comp.tokenId === data.tokenId) {
          const position = data.position || [0, 0, 0];
          const speed = data.speed || 0;
          // Calculate cumulative distance (only increases when actually moving)
          const distance = calculateDistance(data.tokenId, position, speed);
          
          // Debug: Log distance calculation
          if (distance > 0 && Math.random() < 0.005) { // Log 0.5% of updates
            console.log(`Car ${data.tokenId} - Position:`, position, `Distance:`, distance.toFixed(2));
          }
          
          return {
            ...comp,
            speed,
            distance: distance || 0, // Ensure distance is always a number
            laps: lapCountRef.current[data.tokenId] || 0,
            lastUpdate: Date.now(),
          };
        }
        return comp;
      });

      // Sort by laps first, then distance to determine positions
      // More laps = better position
      // If same lap, higher distance = better position
      // Positions are determined SOLELY by distance traveled (and laps completed)
      updated.sort((a, b) => {
        // Primary sort: laps (more laps is better)
        if (b.laps !== a.laps) {
          return b.laps - a.laps;
        }
        // Secondary sort: distance (descending - higher distance is better)
        // This is the main factor for positioning - cars with more distance traveled are ahead
        return (b.distance || 0) - (a.distance || 0);
      });
      
      // Assign positions: 1st place = position 1, 2nd place = position 2, etc.
      // When a car overtakes (increases distance or completes more laps), its position number decreases (better position)
      return updated.map((comp, idx) => ({
        ...comp,
        position: idx + 1, // Position 1 is best, position 2 is second best, etc.
      }));
    });
  }, [isRaceActive, calculateDistance]);

  // Update race progress (called from racing scene for player)
  const updateRaceProgress = useCallback((data) => {
    if (!isRaceActive || !activeRaceId || !currentTokenId) return;

    const now = Date.now();
    
    // Update local state
    setSpeed((prevSpeed) => {
      const targetSpeed = data.speed || 0;
      return prevSpeed + (targetSpeed - prevSpeed) * 0.3;
    });

    // Update competitor data
    updateCompetitor({
      tokenId: currentTokenId,
      ...data,
    });

    // Send telemetry to backend (throttled)
    if (now - lastTelemetryUpdate.current >= TELEMETRY_UPDATE_INTERVAL) {
      lastTelemetryUpdate.current = now;
      
      const position = data.position || [0, 0, 0];
      const distance = calculateDistance(position);

      // Clamp acceleration to reasonable range before sending
      // Acceleration is in m/s², clamp to -10 to 10 range
      const clampedAcceleration = Math.max(-10, Math.min(10, data.acceleration || 0));
      
      racingApi
        .updateTelemetry(activeRaceId, currentTokenId, {
          positionX: position[0] || 0,
          positionY: position[1] || 0,
          speed: Math.round(data.speed || 0), // Already in km/h
          currentLap: Math.floor(distance / 30) + 1, // Approximate laps
          lapProgress: Math.min(100, Math.max(0, (distance % 30) / 30 * 100)),
          acceleration: clampedAcceleration,
        })
        .then(() => {
          console.log("✅ Telemetry updated on-chain");
        })
        .catch((error) => {
          console.warn("Failed to update telemetry:", error);
        });
    }
  }, [isRaceActive, activeRaceId, currentTokenId, updateCompetitor, calculateDistance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (raceTimerRef.current) {
        clearInterval(raceTimerRef.current);
      }
    };
  }, []);

  const value = {
    // State
    isRaceActive,
    selectedCar,
    raceTime,
    speed,
    activeRaceId,
    currentTokenId,
    competitors,
    raceStartTime,
    raceDuration: RACE_DURATION,
    // Actions
    startRace,
    endRace,
    updateRaceProgress,
    updateCompetitor,
    handleLapComplete,
    setSelectedCar,
  };

  return <RaceContext.Provider value={value}>{children}</RaceContext.Provider>;
}

export function useRace() {
  const context = useContext(RaceContext);
  if (!context) {
    throw new Error("useRace must be used within RaceProvider");
  }
  return context;
}

