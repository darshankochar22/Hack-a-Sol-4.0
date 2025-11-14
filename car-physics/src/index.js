import "./F1RacingApp.css";
import { createRoot } from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import { F1RacingScene } from "./F1RacingScene";
import { Physics } from "@react-three/cannon";
import { useState, useEffect, useMemo } from "react";
import { useMultiplayer } from "./hooks/useMultiplayer";
import { MultiplayerLeaderboard } from "./components/MultiplayerLeaderboard";

function App() {
  const [lapCount, setLapCount] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [position, setPosition] = useState([0, 0, 0]);

  // Generate a unique player ID (in production, this should come from auth)
  const playerId = useMemo(() => {
    const stored = localStorage.getItem("playerId");
    if (stored) return stored;
    const newId = `player_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
    localStorage.setItem("playerId", newId);
    return newId;
  }, []);

  // Initialize multiplayer connection
  const {
    isConnected,
    players,
    roomId,
    joinRoom,
    leaveRoom,
    sendPositionUpdate,
  } = useMultiplayer(playerId, (updatedPlayers) => {
    // Optional: handle players update
    console.log("Players updated:", Object.keys(updatedPlayers).length);
  });

  // Auto-join default room on mount
  useEffect(() => {
    if (!roomId) {
      console.log("Attempting to join default race room...");
      joinRoom("default-race");
    }
  }, [roomId, joinRoom]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomId) {
        leaveRoom();
      }
    };
  }, [roomId, leaveRoom]);

  const handleLapComplete = (laps) => {
    setLapCount(laps);
    console.log(`🏁 Lap ${laps} completed!`);
  };

  const handlePositionUpdate = (data) => {
    setPosition(data.position);
    setSpeed(data.speed);
  };

  return (
    <>
      <Canvas shadows>
        <Physics broadphase="SAP" gravity={[0, -9.81, 0]}>
          <F1RacingScene
            onLapComplete={handleLapComplete}
            onPositionUpdate={handlePositionUpdate}
            players={players}
            sendPositionUpdate={sendPositionUpdate}
          />
        </Physics>
      </Canvas>

      {/* Multiplayer Leaderboard */}
      {isConnected && (
        <MultiplayerLeaderboard
          playerId={playerId}
          myPosition={position}
          mySpeed={speed}
          players={players}
        />
      )}

      <div className="f1-controls">
        <div className="f1-hud">
          <div className="hud-item">
            <span className="hud-label">Speed</span>
            <span className="hud-value">{Math.round(speed * 10)} km/h</span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Lap</span>
            <span className="hud-value">{lapCount}</span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Position</span>
            <span className="hud-value">
              {Math.round(position[0] * 10) / 10},{" "}
              {Math.round(position[2] * 10) / 10}
            </span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Multiplayer</span>
            <span
              className="hud-value"
              style={{ color: isConnected ? "#00ff00" : "#ff0000" }}
            >
              {isConnected
                ? `✓ ${Object.keys(players).length + 1} players`
                : "✗ Offline"}
            </span>
          </div>
        </div>

        <div className="controls-info">
          <h3>🏎️ F1 Racing Controls</h3>
          <p>
            <strong>W / ↑</strong> - Accelerate
          </p>
          <p>
            <strong>S / ↓</strong> - Brake/Reverse
          </p>
          <p>
            <strong>A / ←</strong> - Turn Left
          </p>
          <p>
            <strong>D / →</strong> - Turn Right
          </p>
          <p>
            <strong>K</strong> - Toggle Camera
          </p>
          <p>
            <strong>R</strong> - Reset Position
          </p>
        </div>
      </div>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
