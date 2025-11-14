import { PerspectiveCamera } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { F1Car } from "./F1Car";
import { F1BotCar } from "./F1BotCar";
import { F1Track } from "./F1Track";

export function F1RacingScene({ 
  onLapComplete, 
  onPositionUpdate, 
  carType = "ferrari",
  competitors = [], // Array of competitor data
  onCompetitorUpdate, // Callback for bot updates
}) {
  const [thirdPerson, setThirdPerson] = useState(true);
  const cameraPosition = useMemo(() => [-8, 5, 8], []);
  const lastCheckpointRef = useRef(0);
  
  // Filter bots from competitors
  const botCompetitors = useMemo(() => {
    return competitors.filter(c => !c.isPlayer);
  }, [competitors]);

  useEffect(() => {
    function keydownHandler(e) {
      if (e.key === "k" || e.key === "K") {
        setThirdPerson((prev) => !prev);
      }
    }

    window.addEventListener("keydown", keydownHandler);
    return () => window.removeEventListener("keydown", keydownHandler);
  }, []);

  const handleCarPositionUpdate = useCallback((data) => {
    // Forward to parent
    if (onPositionUpdate) {
      onPositionUpdate(data);
    }

    // Track position for lap detection (if needed in future)
    const position = data.position;
    if (position && position[2] !== undefined) {
      lastCheckpointRef.current = position[2];
    }
  }, [onPositionUpdate, onLapComplete]);

  return (
    <Suspense fallback={null}>
      {/* Simple lighting - no external HDR needed */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, 5, -5]} intensity={0.5} />
      <hemisphereLight intensity={0.4} />

      <PerspectiveCamera
        makeDefault
        position={cameraPosition}
        fov={60}
      />

      <F1Track />
      
      {/* Player Car (can be AI or manual) */}
      {competitors.find(c => c.isPlayer) && (
        <F1Car 
          thirdPerson={thirdPerson} 
          onPositionUpdate={handleCarPositionUpdate} 
          carType={carType}
          startFromTrack={true}
          isAI={true} // Make player car AI-controlled too
          aggressiveness={competitors.find(c => c.isPlayer)?.aggressiveness || 50}
          consistency={competitors.find(c => c.isPlayer)?.consistency || 50}
          tokenId={competitors.find(c => c.isPlayer)?.tokenId}
          name={competitors.find(c => c.isPlayer)?.name}
        />
      )}

      {/* AI Bot Cars */}
      {botCompetitors.map((bot, index) => (
        <F1BotCar
          key={bot.tokenId}
          tokenId={bot.tokenId}
          name={bot.name}
          aggressiveness={bot.aggressiveness || 50}
          consistency={bot.consistency || 50}
          carType={bot.carType || "mercedes"}
          startOffset={index + 1} // Staggered start
          onPositionUpdate={onCompetitorUpdate}
        />
      ))}
    </Suspense>
  );
}

