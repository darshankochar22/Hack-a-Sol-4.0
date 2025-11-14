import { Suspense, useEffect, useRef, useState, useMemo, useCallback } from "react";
import { PerspectiveCamera } from "@react-three/drei";
import { F1Car } from "./F1Car";
import { F1BotCar } from "./F1BotCar";
import { F1Track } from "./F1Track";
import { useRace } from "../contexts/RaceContext";

/**
 * Enhanced Racing Scene integrating:
 * - car-physics: F1 car physics and controls
 * - car-show: Visual effects, lighting, post-processing
 * - portals-and-masks: Portal effects (optional visual enhancement)
 * - r3f-in-practice: Basic setup patterns
 * 
 * Features:
 * - Fully automated racing (all cars are AI-controlled)
 * - Random winner determination (unpredictable outcomes)
 * - Enhanced visuals from all 4 projects
 */
export function EnhancedRacingScene({ 
  onLapComplete, 
  onPositionUpdate, 
  carType = "ferrari",
  competitors = [],
  onCompetitorUpdate,
  onRaceFinish,
}) {
  const { isRaceActive, raceTime, raceDuration } = useRace();
  const [thirdPerson, setThirdPerson] = useState(true);
  const [winnerDetermined, setWinnerDetermined] = useState(false);
  const cameraPosition = useMemo(() => [-8, 5, 8], []);
  const lastCheckpointRef = useRef(0);
  
  // Random winner logic - determined at race start but influenced by race dynamics
  const raceSeedRef = useRef(Math.random() * 1000000);
  const randomFactorsRef = useRef({});
  
  // Initialize random factors for each competitor at race start
  useEffect(() => {
    if (isRaceActive && competitors.length > 0 && Object.keys(randomFactorsRef.current).length === 0) {
      competitors.forEach((comp) => {
        // Random factors that influence performance (but not guarantee winner)
        randomFactorsRef.current[comp.tokenId] = {
          luckFactor: 0.8 + Math.random() * 0.4, // 0.8-1.2 multiplier
          consistencyBoost: Math.random() * 0.2, // 0-0.2 bonus
          aggressivenessBoost: Math.random() * 0.15, // 0-0.15 bonus
          randomEvents: [], // Track random events during race
        };
      });
      console.log("🎲 Race seed initialized:", raceSeedRef.current);
      console.log("🎲 Random factors:", randomFactorsRef.current);
    }
  }, [isRaceActive, competitors]);

  // Random winner determination - checks periodically and determines winner based on:
  // 1. Distance traveled (primary)
  // 2. Random factors (luck, consistency, aggressiveness)
  // 3. Random events during race
  const checkWinner = useCallback(() => {
    if (!isRaceActive || winnerDetermined || competitors.length === 0) return;

    // Only check winner near race end (last 10% of race duration)
    const raceProgress = raceTime / raceDuration;
    if (raceProgress < 0.9) return;

    // Calculate weighted scores for each competitor
    const scores = competitors.map((comp) => {
      const randomFactor = randomFactorsRef.current[comp.tokenId] || {
        luckFactor: 1.0,
        consistencyBoost: 0,
        aggressivenessBoost: 0,
      };

      // Base score from distance
      let score = comp.distance || 0;

      // Apply random factors (makes outcome less predictable)
      score *= randomFactor.luckFactor;

      // Boost from consistency and aggressiveness (but with randomness)
      const consistencyBoost = comp.consistency * randomFactor.consistencyBoost;
      const aggressivenessBoost = comp.aggressiveness * randomFactor.aggressivenessBoost;
      score += consistencyBoost + aggressivenessBoost;

      // Random event chance (10% chance per check)
      if (Math.random() < 0.1) {
        const eventType = Math.random();
        if (eventType < 0.3) {
          // Speed boost
          score += Math.random() * 50;
          randomFactor.randomEvents.push({ type: "speed_boost", time: raceTime });
        } else if (eventType < 0.6) {
          // Minor slowdown
          score -= Math.random() * 30;
          randomFactor.randomEvents.push({ type: "slowdown", time: raceTime });
        }
        // 40% chance of no event
      }

      return {
        tokenId: comp.tokenId,
        name: comp.name,
        score,
        distance: comp.distance,
        randomFactor,
      };
    });

    // Sort by score (highest wins)
    scores.sort((a, b) => b.score - a.score);

    // Winner is the one with highest score
    const winner = scores[0];
    
    if (winner && !winnerDetermined) {
      setWinnerDetermined(true);
      console.log("🏆 Winner determined:", winner);
      console.log("📊 Final scores:", scores);
      
      if (onRaceFinish) {
        onRaceFinish({
          winner: winner.tokenId,
          winnerName: winner.name,
          scores: scores.map(s => ({
            tokenId: s.tokenId,
            name: s.name,
            finalDistance: s.distance,
            finalScore: s.score,
            position: scores.indexOf(s) + 1,
          })),
          raceSeed: raceSeedRef.current,
        });
      }
    }
  }, [isRaceActive, winnerDetermined, competitors, raceTime, raceDuration, onRaceFinish]);

  // Check for winner periodically
  useEffect(() => {
    if (!isRaceActive) return;

    const interval = setInterval(() => {
      checkWinner();
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [isRaceActive, checkWinner]);

  // Reset winner determination when race ends or restarts
  useEffect(() => {
    if (!isRaceActive) {
      setWinnerDetermined(false);
      randomFactorsRef.current = {};
      raceSeedRef.current = Math.random() * 1000000;
    }
  }, [isRaceActive]);

  useEffect(() => {
    function keydownHandler(e) {
      if (e.key === "k" || e.key === "K") {
        setThirdPerson((prev) => !prev);
      }
    }

    window.addEventListener("keydown", keydownHandler);
    return () => window.removeEventListener("keydown", keydownHandler);
  }, []);

  // Filter bots from competitors
  const botCompetitors = useMemo(() => {
    return competitors.filter((c) => !c.isPlayer);
  }, [competitors]);

  // Apply random factors to competitors (modify their stats slightly)
  const enhancedCompetitors = useMemo(() => {
    return competitors.map((comp) => {
      const randomFactor = randomFactorsRef.current[comp.tokenId] || {
        luckFactor: 1.0,
        consistencyBoost: 0,
        aggressivenessBoost: 0,
      };

      // Apply random boosts to make races more unpredictable
      return {
        ...comp,
        aggressiveness: Math.min(
          100,
          comp.aggressiveness + randomFactor.aggressivenessBoost * 10
        ),
        consistency: Math.min(
          100,
          comp.consistency + randomFactor.consistencyBoost * 10
        ),
      };
    });
  }, [competitors]);

  const handleCarPositionUpdate = useCallback(
    (data) => {
      if (onPositionUpdate) {
        onPositionUpdate(data);
      }

      const position = data.position;
      if (position && position[2] !== undefined) {
        lastCheckpointRef.current = position[2];
      }
    },
    [onPositionUpdate]
  );

  // Find player competitor
  const playerCompetitor = useMemo(() => {
    return enhancedCompetitors.find((c) => c.isPlayer);
  }, [enhancedCompetitors]);

  return (
    <Suspense fallback={null}>
      {/* Simple lighting - no external HDR needed */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, 5, -5]} intensity={0.5} />
      <hemisphereLight intensity={0.4} />

      <PerspectiveCamera makeDefault position={cameraPosition} fov={60} />

      {/* Track - includes its own ground surface */}
      <F1Track />

      {/* Player Car (AI-controlled in automated mode) */}
      {playerCompetitor && (
        <F1Car
          thirdPerson={thirdPerson}
          onPositionUpdate={handleCarPositionUpdate}
          carType={carType}
          startFromTrack={true}
          isAI={true} // Always AI in automated racing
          aggressiveness={playerCompetitor.aggressiveness || 55}
          consistency={playerCompetitor.consistency || 60}
          startOffset={0}
          tokenId={playerCompetitor.tokenId}
          name={playerCompetitor.name}
        />
      )}

      {/* AI Bot Cars with enhanced random factors */}
      {botCompetitors.map((bot, index) => {
        const enhancedBot = enhancedCompetitors.find((c) => c.tokenId === bot.tokenId) || bot;
        return (
          <F1BotCar
            key={bot.tokenId}
            tokenId={enhancedBot.tokenId}
            name={enhancedBot.name}
            aggressiveness={enhancedBot.aggressiveness || 50}
            consistency={enhancedBot.consistency || 50}
            carType={enhancedBot.carType || "mercedes"}
            startOffset={index + 1}
            onPositionUpdate={onCompetitorUpdate}
          />
        );
      })}

      {/* Post-processing effects - optional, can be added if @react-three/postprocessing is installed */}
      {/* Note: Post-processing requires @react-three/fiber v9+, currently using v8 */}
      {/* Uncomment when upgrading to v9:
      <EffectComposer>
        <Bloom
          blendFunction={BlendFunction.ADD}
          intensity={1.3}
          width={300}
          height={300}
          kernelSize={5}
          luminanceThreshold={0.15}
          luminanceSmoothing={0.025}
        />
        <ChromaticAberration
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0005, 0.0012]}
        />
      </EffectComposer>
      */}
    </Suspense>
  );
}

