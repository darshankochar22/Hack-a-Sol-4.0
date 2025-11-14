import { useState, useRef, useEffect } from "react";

export const useScoring = () => {
  const [score, setScore] = useState(0);
  const [totalLaps, setTotalLaps] = useState(0);
  const [bestLapTime, setBestLapTime] = useState(null);
  const [currentLapTime, setCurrentLapTime] = useState(0);
  const [lapTimes, setLapTimes] = useState([]);
  const [showLapNotification, setShowLapNotification] = useState(false);
  const [lastLapPoints, setLastLapPoints] = useState(0);
  const [lastLapTime, setLastLapTime] = useState(null);

  const lapStartTimeRef = useRef(Date.now());
  const lastLapTimeRef = useRef(null);

  // Calculate points for a lap
  const calculateLapPoints = (lapTime, lapNumber) => {
    let points = 0;

    // Base points per lap
    const basePoints = 100;
    points += basePoints;

    // Speed bonus (faster = more points)
    // Target time: 30 seconds, faster gets bonus
    const targetTime = 30000; // 30 seconds in ms
    if (lapTime < targetTime) {
      const timeBonus = Math.max(0, (targetTime - lapTime) / 100); // Up to 300 bonus points
      points += timeBonus;
    }

    // Lap number multiplier (more laps = slightly more points)
    const lapMultiplier = 1 + lapNumber * 0.1; // 10% more per lap
    points *= lapMultiplier;

    // Consistency bonus (if lap time is similar to previous)
    if (lastLapTimeRef.current) {
      const timeDiff = Math.abs(lapTime - lastLapTimeRef.current);
      if (timeDiff < 2000) {
        // Within 2 seconds
        points += 50; // Consistency bonus
      }
    }

    // Milestone bonuses
    if (lapNumber === 5) points += 200; // 5 laps milestone
    if (lapNumber === 10) points += 500; // 10 laps milestone
    if (lapNumber === 20) points += 1000; // 20 laps milestone

    return Math.round(points);
  };

  // Handle lap completion
  const handleLapComplete = (lapNumber) => {
    const now = Date.now();
    const lapTime = now - lapStartTimeRef.current;

    // Update best lap time
    if (!bestLapTime || lapTime < bestLapTime) {
      setBestLapTime(lapTime);
    }

    // Calculate points
    const lapPoints = calculateLapPoints(lapTime, lapNumber);
    setScore((prev) => prev + lapPoints);
    setLastLapPoints(lapPoints);
    setLastLapTime(lapTime);

    // Store lap time
    setLapTimes((prev) => [...prev, { lap: lapNumber, time: lapTime }]);
    lastLapTimeRef.current = lapTime;

    // Update totals
    setTotalLaps(lapNumber);

    // Show notification
    setShowLapNotification(true);
    setTimeout(() => {
      setShowLapNotification(false);
    }, 3000);

    // Reset lap timer
    lapStartTimeRef.current = now;
  };

  // Update current lap time
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - lapStartTimeRef.current;
      setCurrentLapTime(elapsed);
    }, 100); // Update every 100ms

    return () => clearInterval(interval);
  }, []);

  // Format time as MM:SS.mmm
  const formatTime = (ms) => {
    if (!ms) return "00:00.000";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
  };

  // Reset scoring
  const resetScoring = () => {
    setScore(0);
    setTotalLaps(0);
    setBestLapTime(null);
    setCurrentLapTime(0);
    setLapTimes([]);
    lapStartTimeRef.current = Date.now();
    lastLapTimeRef.current = null;
  };

  return {
    score,
    totalLaps,
    bestLapTime,
    currentLapTime,
    lapTimes,
    showLapNotification,
    lastLapPoints,
    lastLapTime,
    handleLapComplete,
    formatTime,
    resetScoring,
  };
};
