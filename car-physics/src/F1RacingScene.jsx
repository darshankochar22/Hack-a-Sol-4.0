import { PerspectiveCamera } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import { F1Car } from "./F1Car";
import { F1Track } from "./F1Track";
import { RemoteCar } from "./components/RemoteCar";

export function F1RacingScene({ onLapComplete, onPositionUpdate, players, sendPositionUpdate }) {
  const [thirdPerson, setThirdPerson] = useState(true);
  const [cameraPosition, setCameraPosition] = useState([-8, 5, 8]);
  const [lapCount, setLapCount] = useState(0);
  const lastCheckpointRef = useRef(0);

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

    // Check lap completion
    const position = data.position;
    // Simple lap detection: when car passes start line (z > 15 and was behind)
    const startLineZ = 25 * 0.6; // Match track radius * 0.6
    if (position[2] > startLineZ && lastCheckpointRef.current < startLineZ) {
      setLapCount((prev) => {
        const newLap = prev + 1;
        if (onLapComplete) onLapComplete(newLap);
        return newLap;
      });
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

      {/* Lap counter UI */}
      {lapCount > 0 && (
        <mesh position={[0, 3, 0]}>
          <planeGeometry args={[2, 0.5]} />
          <meshBasicMaterial color="black" transparent opacity={0.7} />
        </mesh>
      )}
    </Suspense>
  );
}

