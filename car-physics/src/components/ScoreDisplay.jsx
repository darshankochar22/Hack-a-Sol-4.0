export function ScoreDisplay({ score, totalLaps, bestLapTime, currentLapTime, formatTime }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        right: "350px", // Position to the left of leaderboard
        background: "rgba(0, 0, 0, 0.8)",
        color: "#fff",
        padding: "15px 20px",
        borderRadius: "10px",
        minWidth: "250px",
        fontFamily: "monospace",
        fontSize: "14px",
        zIndex: 1000,
        border: "2px solid #00ff00",
      }}
    >
      <div
        style={{
          marginBottom: "12px",
          paddingBottom: "10px",
          borderBottom: "2px solid #00ff00",
          fontSize: "16px",
          fontWeight: "bold",
        }}
      >
        🏆 Score & Stats
      </div>

      <div style={{ marginBottom: "10px" }}>
        <div style={{ color: "#888", fontSize: "12px", marginBottom: "4px" }}>
          Total Score
        </div>
        <div style={{ color: "#00ff00", fontSize: "24px", fontWeight: "bold" }}>
          {score.toLocaleString()} pts
        </div>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <div style={{ color: "#888", fontSize: "12px", marginBottom: "4px" }}>
          Total Laps
        </div>
        <div style={{ color: "#fff", fontSize: "20px", fontWeight: "bold" }}>
          {totalLaps}
        </div>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <div style={{ color: "#888", fontSize: "12px", marginBottom: "4px" }}>
          Current Lap Time
        </div>
        <div style={{ color: "#00ffff", fontSize: "18px", fontFamily: "monospace" }}>
          {formatTime(currentLapTime)}
        </div>
      </div>

      {bestLapTime && (
        <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.2)" }}>
          <div style={{ color: "#888", fontSize: "12px", marginBottom: "4px" }}>
            ⚡ Best Lap
          </div>
          <div style={{ color: "#ffaa00", fontSize: "18px", fontFamily: "monospace", fontWeight: "bold" }}>
            {formatTime(bestLapTime)}
          </div>
        </div>
      )}

      {/* Milestones */}
      {totalLaps >= 5 && totalLaps < 10 && (
        <div style={{ marginTop: "10px", color: "#ffaa00", fontSize: "12px" }}>
          🎯 5 Laps Milestone Reached!
        </div>
      )}
      {totalLaps >= 10 && totalLaps < 20 && (
        <div style={{ marginTop: "10px", color: "#ffaa00", fontSize: "12px" }}>
          🎯 10 Laps Milestone Reached!
        </div>
      )}
      {totalLaps >= 20 && (
        <div style={{ marginTop: "10px", color: "#ffaa00", fontSize: "12px" }}>
          🎯 20 Laps Milestone Reached!
        </div>
      )}
    </div>
  );
}

