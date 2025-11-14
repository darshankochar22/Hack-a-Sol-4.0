import { useState, useEffect, useCallback, useRef } from "react";

export const useBetting = (
  playerId,
  players,
  myScore,
  myLaps,
  mySpeed,
  myPosition
) => {
  const [bets, setBets] = useState([]); // Array of { playerId, amount, timestamp }
  const [playerPerformance, setPlayerPerformance] = useState({});
  const [totalPool, setTotalPool] = useState(0);
  const performanceRef = useRef({});

  // Update player performance metrics
  useEffect(() => {
    const updatePerformance = () => {
      const newPerformance = {
        [playerId]: {
          score: myScore || 0,
          laps: myLaps || 0,
          speed: mySpeed || 0,
          position: myPosition || [0, 0, 0],
          lastUpdate: Date.now(),
        },
      };

      // Add other players' performance
      if (players) {
        Object.entries(players).forEach(([id, data]) => {
          // Get performance from player data if available
          newPerformance[id] = {
            score: data.score || 0,
            laps: data.laps || 0,
            speed: data.speed || 0,
            position: data.position || [0, 0, 0],
            lastUpdate: data.timestamp || Date.now(),
          };
        });
      }

      performanceRef.current = newPerformance;
      setPlayerPerformance(newPerformance);
    };

    updatePerformance();
    const interval = setInterval(updatePerformance, 500); // Update every 500ms
    return () => clearInterval(interval);
  }, [playerId, players, myScore, myLaps, mySpeed, myPosition]);

  // Calculate odds for each player based on performance
  const calculateOdds = useCallback(() => {
    const performance = playerPerformance; // Use state instead of ref for reactivity
    const playerIds = Object.keys(performance);

    if (playerIds.length < 2) {
      return {};
    }

    const odds = {};

    // Calculate performance score for each player
    const performanceScores = {};
    playerIds.forEach((id) => {
      const perf = performance[id];
      if (!perf) return;
      // Performance score = (laps * 100) + (score / 10) + (speed * 0.1)
      const score =
        (perf.laps || 0) * 100 +
        (perf.score || 0) / 10 +
        (perf.speed || 0) * 0.1;
      performanceScores[id] = Math.max(score, 1); // Minimum 1 to avoid division by zero
    });

    // Calculate total performance
    const totalPerformance = Object.values(performanceScores).reduce(
      (sum, score) => sum + score,
      0
    );

    if (totalPerformance === 0) {
      return {};
    }

    // Calculate odds (percentage chance to win)
    playerIds.forEach((id) => {
      const score = performanceScores[id];
      if (!score) return;
      const percentage = (score / totalPerformance) * 100;
      const multiplier = totalPerformance / score; // Payout multiplier

      odds[id] = {
        percentage: percentage.toFixed(1),
        multiplier: multiplier.toFixed(2),
        performanceScore: score,
      };
    });

    return odds;
  }, [playerPerformance]);

  // Place a bet on a player
  const placeBet = useCallback(
    (targetPlayerId, amount) => {
      if (!targetPlayerId || amount <= 0) return false;
      if (targetPlayerId === playerId) {
        alert("You cannot bet on yourself!");
        return false;
      }

      const newBet = {
        id: `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        playerId: playerId,
        targetPlayerId: targetPlayerId,
        amount: amount,
        timestamp: Date.now(),
        claimed: false,
      };

      setBets((prev) => [...prev, newBet]);
      setTotalPool((prev) => prev + amount);
      return true;
    },
    [playerId]
  );

  // Calculate potential winnings for a bet
  const calculateWinnings = useCallback(
    (bet) => {
      const odds = calculateOdds();
      const targetOdds = odds[bet.targetPlayerId];
      if (!targetOdds) return 0;

      return bet.amount * parseFloat(targetOdds.multiplier);
    },
    [calculateOdds]
  );

  // Get available players to bet on (exclude self)
  const getAvailablePlayers = useCallback(() => {
    const performance = performanceRef.current;
    return Object.keys(performance).filter((id) => id !== playerId);
  }, [playerId]);

  // Get player stats for display
  const getPlayerStats = useCallback((targetPlayerId) => {
    const performance = performanceRef.current[targetPlayerId];
    if (!performance) return null;

    return {
      score: performance.score || 0,
      laps: performance.laps || 0,
      speed: performance.speed || 0,
      lastUpdate: performance.lastUpdate || Date.now(),
    };
  }, []);

  return {
    bets,
    playerPerformance,
    totalPool,
    calculateOdds,
    placeBet,
    calculateWinnings,
    getAvailablePlayers,
    getPlayerStats,
  };
};
