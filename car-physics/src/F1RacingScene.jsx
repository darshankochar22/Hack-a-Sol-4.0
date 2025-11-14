import { PerspectiveCamera } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { F1Car } from "./F1Car";
import { F1Track } from "./F1Track";
import { RemoteCar } from "./components/RemoteCar";

export function F1RacingScene({ onLapComplete, onPositionUpdate, players, sendPositionUpdate }) {
  const [thirdPerson, setThirdPerson] = useState(true);
  const [cameraPosition, setCameraPosition] = useState([-8, 5, 8]);
  const [showFinishLineEffect, setShowFinishLineEffect] = useState(false);
  const lastCheckpointRef = useRef(0);
  const lapCountRef = useRef(0); // Track lap count locally

  useEffect(() => {
    function keydownHandler(e) {
      if (e.key === "k" || e.key === "K") {
        if (thirdPerson) {
          setCameraPosition([-8, 5, 8 + Math.random() * 0.01]);
        }
        setThirdPerson(!thirdPerson);
      }
    }

    window.addEventListener("keydown", keydownHandler);
    return () => window.removeEventListener("keydown", keydownHandler);
  }, [thirdPerson]);

  const handleCarPositionUpdate = (data) => {
    // Forward to parent
    if (onPositionUpdate) {
      onPositionUpdate(data);
    }

    // Check lap completion - improved detection
    const position = data.position;
    const startLineZ = 25 * 0.6; // Match track radius * 0.6 (15)
    const trackRadius = 25;
    const innerRadius = trackRadius * 0.65;
    
    // Check if car is crossing the start line
    // Must be moving forward (z increasing) and within track boundaries
    const isCrossingLine = 
      position[2] > startLineZ && 
      lastCheckpointRef.current < startLineZ;
    
    // Check if car is within track boundaries (on the track, not outside)
    const distanceFromCenter = Math.sqrt(position[0] ** 2 + (position[2] / 0.6) ** 2);
    const isOnTrack = distanceFromCenter >= innerRadius - 1 && distanceFromCenter <= trackRadius + 1;
    
    if (isCrossingLine && isOnTrack) {
      // Increment lap count
      lapCountRef.current += 1;
      const newLap = lapCountRef.current;
      
      if (onLapComplete) {
        onLapComplete(newLap);
      }
      
      // Show finish line effect
      setShowFinishLineEffect(true);
      setTimeout(() => {
        setShowFinishLineEffect(false);
      }, 500);
    }
    lastCheckpointRef.current = position[2];
  };

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
      <F1Car 
        thirdPerson={thirdPerson} 
        onPositionUpdate={handleCarPositionUpdate}
        sendPositionUpdate={sendPositionUpdate}
      />

      {/* Render remote players */}
      {players && Object.entries(players).map(([playerId, playerData]) => (
        <RemoteCar
          key={playerId}
          playerId={playerId}
          position={playerData.position || [0, 0.3, 0]}
          rotation={playerData.rotation || { x: 0, y: 0, z: 0, w: 1 }}
          speed={playerData.speed || 0}
        />
      ))}

      {/* Finish line crossing effect - green flash */}
      {showFinishLineEffect && (
        <mesh position={[0, 0.15, 25 * 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10, 2]} />
          <meshBasicMaterial 
            color="#00ff00" 
            transparent 
            opacity={0.8}
          />
        </mesh>
      )}
    </Suspense>
  );
}

