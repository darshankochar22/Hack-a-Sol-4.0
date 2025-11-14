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
  const TELEMETRY_UPDATE_INTERVAL = 2000; // Update every 2 seconds

  // Calculate points based on position (F1 style: 25, 18, 15, 12, 10, 8, 6, 4, 2, 1)
  const calculatePoints = useCallback((position, totalCompetitors) => {
    const pointsTable = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    if (position <= pointsTable.length) {
      return pointsTable[position - 1];
    }
    return 0;
  }, []);

  // End race manually or when time expires
  const endRace = useCallback(() => {
    setIsRaceActive(false);
    if (raceTimerRef.current) {
      clearInterval(raceTimerRef.current);
      raceTimerRef.current = null;
    }
    
    // Calculate final positions and points
    setCompetitors((prevCompetitors) => {
      const sortedCompetitors = [...prevCompetitors].sort((a, b) => b.distance - a.distance);
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
    
    // Initialize competitors (player + bots)
    const allCompetitors = [
      {
        tokenId,
        name: `Car #${tokenId}`,
        isPlayer: true,
        speed: 0,
        distance: 0,
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

  // Calculate distance traveled (simple track distance calculation)
  const calculateDistance = useCallback((position) => {
    // Simple distance calculation based on track position
    // Track is roughly 60 units long (z: -15 to 15, x: -7 to 7)
    const z = position[2] || 0;
    const x = position[0] || 0;
    
    // Base distance from start line
    let distance = Math.abs(z - 14.5);
    
    // Add distance from center line (x offset)
    distance += Math.abs(x) * 0.5;
    
    return distance;
  }, []);

  // Update competitor data (called from racing scene for all cars)
  const updateCompetitor = useCallback((data) => {
    if (!isRaceActive) return;

    setCompetitors((prev) => {
      const updated = prev.map((comp) => {
        if (comp.tokenId === data.tokenId) {
          const position = data.position || [0, 0, 0];
          const distance = calculateDistance(position);
          
          return {
            ...comp,
            speed: data.speed || 0,
            distance,
            lastUpdate: Date.now(),
          };
        }
        return comp;
      });

      // Sort by distance to determine positions
      updated.sort((a, b) => b.distance - a.distance);
      return updated.map((comp, idx) => ({
        ...comp,
        position: idx + 1,
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
  }, [isRaceActive, activeRaceId, currentTokenId, raceTime, updateCompetitor, calculateDistance]);

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

