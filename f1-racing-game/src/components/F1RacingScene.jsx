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
  const [thirdPerson, setThirdPerson] = useState(true); // Start with 3D third-person camera
  const cameraPosition = useMemo(() => [0, 5, 10], []); // Default 3D camera position
  const lapCountRef = useRef({}); // Track laps for each car - { tokenId: { lastZ, laps, crossedStart } }
  
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

  // Shared lap tracking function for all cars
  const trackLapCompletion = useCallback((data) => {
    const position = data.position;
    const tokenId = data.tokenId;
    
    if (position && position[2] !== undefined && tokenId) {
      const currentZ = position[2];
      
      // Initialize checkpoint tracking for this car
      if (!lapCountRef.current[tokenId]) {
        lapCountRef.current[tokenId] = { lastZ: currentZ, laps: 0, crossedStart: false };
      }
      
      const carLapData = lapCountRef.current[tokenId];
      
      // Check if car crossed start line (z=14.5) going forward
      // Start line is at z=15, track goes from z=15 down to z=-15 and back to z=15
      if (!carLapData.crossedStart && currentZ >= 14.5) {
        // Car just crossed start line going forward
        carLapData.crossedStart = true;
      } else if (carLapData.crossedStart && currentZ < 13) {
        // Car went past start line (now behind it)
        carLapData.crossedStart = false;
      } else if (carLapData.crossedStart && carLapData.lastZ < 14.5 && currentZ >= 14.5) {
        // Car crossed start line again (completed a lap)
        carLapData.laps++;
        console.log(`🏁 Car ${tokenId} (${data.name || 'Unknown'}) completed lap ${carLapData.laps}`);
        
        // Trigger lap complete callback
        if (onLapComplete) {
          onLapComplete({ tokenId, lap: carLapData.laps });
        }
      }
      
      carLapData.lastZ = currentZ;
    }
  }, [onLapComplete]);

  // Handle player car position updates
  const handleCarPositionUpdate = useCallback((data) => {
    // Forward to parent
    if (onPositionUpdate) {
      onPositionUpdate(data);
    }
    // Track lap completion
    trackLapCompletion(data);
  }, [onPositionUpdate, trackLapCompletion]);

  // Handle bot car position updates
  const handleBotPositionUpdate = useCallback((data) => {
    // Forward to competitor update
    if (onCompetitorUpdate) {
      onCompetitorUpdate(data);
    }
    // Track lap completion
    trackLapCompletion(data);
  }, [onCompetitorUpdate, trackLapCompletion]);

  return (
    <Suspense fallback={null}>
      {/* Simple lighting - no external HDR needed */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
      <directionalLight position={[-10, 5, -5]} intensity={0.5} />
      <hemisphereLight intensity={0.4} />

      {/* Camera - 3D third-person view following player car */}
      <PerspectiveCamera
        makeDefault
        position={cameraPosition}
        fov={60}
      />

      <F1Track />
      
      {/* Player Car - manual control (not AI) */}
      {competitors.find(c => c.isPlayer) ? (
        <F1Car 
          thirdPerson={thirdPerson} 
          onPositionUpdate={handleCarPositionUpdate} 
          carType={carType}
          startFromTrack={true}
          isAI={false} // Player car is manually controlled
          aggressiveness={competitors.find(c => c.isPlayer)?.aggressiveness || 55}
          consistency={competitors.find(c => c.isPlayer)?.consistency || 60}
          startOffset={0} // All cars start from same position
          tokenId={competitors.find(c => c.isPlayer)?.tokenId}
          name={competitors.find(c => c.isPlayer)?.name}
        />
      ) : (
        // If no player in competitors, render a default player car
        <F1Car 
          thirdPerson={thirdPerson} 
          onPositionUpdate={handleCarPositionUpdate} 
          carType={carType}
          startFromTrack={true}
          isAI={false} // Player car is manually controlled
          startOffset={0}
          tokenId={1}
          name="Player"
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
          startOffset={0} // All cars start from same position
          onPositionUpdate={handleBotPositionUpdate}
        />
      ))}
    </Suspense>
  );
}


