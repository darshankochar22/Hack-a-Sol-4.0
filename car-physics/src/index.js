import "./F1RacingApp.css";
import { createRoot } from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import { F1RacingScene } from "./F1RacingScene";
import { Physics } from "@react-three/cannon";
import { useState, useEffect, useMemo } from "react";
import { useMultiplayer } from "./hooks/useMultiplayer";
import { useScoring } from "./hooks/useScoring";
import { useBetting } from "./hooks/useBetting";
import { MultiplayerLeaderboard } from "./components/MultiplayerLeaderboard";
import { ServerConnection } from "./components/ServerConnection";
import { ScoreDisplay } from "./components/ScoreDisplay";
import { LapNotification } from "./components/LapNotification";
import { BettingPanel } from "./components/BettingPanel";

function App() {
  const [speed, setSpeed] = useState(0);
  const [position, setPosition] = useState([0, 0, 0]);
  const [serverUrl, setServerUrl] = useState(
    () => localStorage.getItem("multiplayerServerUrl") || ""
  );

  // Scoring system
  const {
    score,
    totalLaps,
    bestLapTime,
    currentLapTime,
    showLapNotification,
    lastLapPoints,
    lastLapTime,
    handleLapComplete: handleScoringLapComplete,
    formatTime,
  } = useScoring();

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
    sendPerformanceUpdate,
    serverUrl: currentServerUrl,
  } = useMultiplayer(
    playerId,
    (updatedPlayers) => {
      // Optional: handle players update
      console.log("Players updated:", Object.keys(updatedPlayers).length);
    },
    serverUrl
  );

  // Initialize betting system
  const bettingHook = useBetting(
    playerId,
    players,
    score,
    totalLaps,
    speed,
    position
  );

  // Send performance updates when score or laps change
  useEffect(() => {
    if (isConnected && sendPerformanceUpdate) {
      sendPerformanceUpdate(score, totalLaps);
    }
  }, [score, totalLaps, isConnected, sendPerformanceUpdate]);

  // Handle server URL change
  const handleServerChange = (newServerUrl) => {
    setServerUrl(newServerUrl);
    // The useMultiplayer hook will automatically reconnect with new URL
  };

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
    // Handle scoring for lap completion
    handleScoringLapComplete(laps);
    console.log(`🏁 Lap ${laps} completed! Current score: ${score}`);
  };

  const handlePositionUpdate = (data) => {
    setPosition(data.position);
    setSpeed(data.speed);
  };

  // Create a wrapper for sendPositionUpdate that includes performance data
  const sendPositionUpdateWithPerformance = useMemo(() => {
    return (position, rotation, speed) => {
      if (sendPositionUpdate) {
        sendPositionUpdate(position, rotation, speed, score, totalLaps);
      }
    };
  }, [sendPositionUpdate, score, totalLaps]);

  return (
    <>
      <Canvas shadows>
        <Physics broadphase="SAP" gravity={[0, -9.81, 0]}>
          <F1RacingScene
            onLapComplete={handleLapComplete}
            onPositionUpdate={handlePositionUpdate}
            players={players}
            sendPositionUpdate={sendPositionUpdateWithPerformance}
          />
        </Physics>
      </Canvas>

      {/* Server Connection UI */}
      <ServerConnection
        onServerChange={handleServerChange}
        currentServer={currentServerUrl}
        isConnected={isConnected}
      />

      {/* Score Display */}
      <ScoreDisplay
        score={score}
        totalLaps={totalLaps}
        bestLapTime={bestLapTime}
        currentLapTime={currentLapTime}
        formatTime={formatTime}
      />

      {/* Lap Completion Notification */}
      {showLapNotification && (
        <LapNotification
          show={showLapNotification}
          lapNumber={totalLaps}
          lapTime={lastLapTime}
          points={lastLapPoints}
          formatTime={formatTime}
        />
      )}

      {/* Multiplayer Leaderboard */}
      {isConnected && (
        <MultiplayerLeaderboard
          playerId={playerId}
          myPosition={position}
          mySpeed={speed}
          players={players}
        />
      )}

      {/* Betting Panel */}
      {isConnected && (
        <BettingPanel
          playerId={playerId}
          players={players}
          myScore={score}
          myLaps={totalLaps}
          mySpeed={speed}
          myPosition={position}
          bettingHook={bettingHook}
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
            <span className="hud-value">{totalLaps}</span>
          </div>
          <div className="hud-item">
            <span className="hud-label">Score</span>
            <span className="hud-value" style={{ color: "#00ff00" }}>
              {score.toLocaleString()}
            </span>
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
          <p
            style={{
              marginTop: "15px",
              paddingTop: "15px",
              borderTop: "1px solid #444",
            }}
          >
            <strong style={{ color: "#00ff00" }}>🏆 Scoring:</strong>
          </p>
          <p style={{ fontSize: "12px", color: "#aaa" }}>• 100 pts per lap</p>
          <p style={{ fontSize: "12px", color: "#aaa" }}>
            • Speed bonus for fast laps
          </p>
          <p style={{ fontSize: "12px", color: "#aaa" }}>
            • Milestone bonuses at 5/10/20 laps
          </p>
        </div>
      </div>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
