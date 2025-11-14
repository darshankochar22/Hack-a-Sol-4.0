import { useMemo } from "react";

// Calculate track progress for position comparison
// For an oval track, we calculate distance along the track
const calculateTrackProgress = (position) => {
  if (!position || !Array.isArray(position) || position.length < 3) return 0;
  
  const [x, y, z] = position;
  
  // For an oval track, we can use a combination of:
  // 1. Z position (forward progress)
  // 2. Distance from center (for turns)
  // This gives a better approximation of track position
  
  // Simple approach: use Z as primary, with X as secondary
  // Higher Z = further along the track
  // We normalize X to account for turns
  const baseProgress = z || 0;
  const turnFactor = Math.abs(x || 0) * 0.1; // Small adjustment for turns
  
  return baseProgress + turnFactor;
};

export function MultiplayerLeaderboard({ 
  playerId, 
  myPosition, 
  mySpeed, 
  players 
}) {
  // Calculate race positions
  const racePositions = useMemo(() => {
    if (!players || Object.keys(players).length === 0) return [];

    // Include current player
    const allPlayers = [
      {
        playerId: playerId,
        position: myPosition,
        speed: mySpeed,
        isMe: true,
      },
      ...Object.entries(players).map(([id, data]) => ({
        playerId: id,
        position: data.position,
        speed: data.speed || 0,
        isMe: false,
      })),
    ];

    // Calculate track progress for each player
    const playersWithProgress = allPlayers.map((player) => ({
      ...player,
      trackProgress: calculateTrackProgress(player.position),
    }));

    // Sort by track progress (higher Z = further ahead)
    playersWithProgress.sort((a, b) => b.trackProgress - a.trackProgress);

    // Assign positions
    return playersWithProgress.map((player, index) => ({
      ...player,
      racePosition: index + 1,
    }));
  }, [playerId, myPosition, mySpeed, players]);

  // Find my position in the race
  const myRacePosition = useMemo(() => {
    const myEntry = racePositions.find((p) => p.isMe);
    return myEntry ? myEntry.racePosition : null;
  }, [racePositions]);

  // Calculate distance ahead/behind for each player relative to me
  const playersWithDistance = useMemo(() => {
    const myEntry = racePositions.find((p) => p.isMe);
    if (!myEntry) return [];

    return racePositions.map((player) => {
      const distance = player.trackProgress - myEntry.trackProgress;
      return {
        ...player,
        distance: Math.abs(distance),
        isAhead: distance > 0,
        isBehind: distance < 0,
      };
    });
  }, [racePositions]);

  if (racePositions.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        right: "20px",
        background: "rgba(0, 0, 0, 0.8)",
        color: "#fff",
        padding: "15px",
        borderRadius: "10px",
        minWidth: "300px",
        fontFamily: "monospace",
        fontSize: "14px",
        zIndex: 1000,
        border: "2px solid #00ff00",
      }}
    >
      <div
        style={{
          marginBottom: "10px",
          paddingBottom: "10px",
          borderBottom: "2px solid #00ff00",
          fontSize: "16px",
          fontWeight: "bold",
        }}
      >
        🏁 Race Positions
      </div>

      {playersWithDistance.map((player) => (
        <div
          key={player.playerId}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid rgba(255, 255, 255, 0.2)",
            backgroundColor: player.isMe ? "rgba(0, 255, 0, 0.2)" : "transparent",
            fontWeight: player.isMe ? "bold" : "normal",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                color: player.isMe ? "#00ff00" : "#fff",
                minWidth: "30px",
              }}
            >
              {player.racePosition === 1 && "🥇"}
              {player.racePosition === 2 && "🥈"}
              {player.racePosition === 3 && "🥉"}
              {player.racePosition > 3 && `${player.racePosition}.`}
            </span>
            <span style={{ color: player.isMe ? "#00ff00" : "#fff" }}>
              {player.isMe ? "YOU" : `Player ${player.playerId.slice(-6)}`}
            </span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "4px",
            }}
          >
            <span style={{ color: "#00ffff" }}>
              {Math.round(player.speed * 10)} km/h
            </span>
            {!player.isMe && (
              <span
                style={{
                  fontSize: "12px",
                  color: player.isAhead ? "#ff6b6b" : "#4ecdc4",
                }}
              >
                {player.isAhead
                  ? `+${Math.round(player.distance * 100) / 100}m ahead`
                  : `${Math.round(player.distance * 100) / 100}m behind`}
              </span>
            )}
          </div>
        </div>
      ))}

      <div
        style={{
          marginTop: "10px",
          paddingTop: "10px",
          borderTop: "2px solid #00ff00",
          fontSize: "12px",
          color: "#888",
          textAlign: "center",
        }}
      >
        <div>Your Position: <strong style={{color: "#00ff00"}}>{myRacePosition || "?"} / {racePositions.length}</strong></div>
        {racePositions.length > 1 && (
          <div style={{marginTop: "4px", fontSize: "11px"}}>
            {myRacePosition === 1 && "🏆 You're in the lead!"}
            {myRacePosition === racePositions.length && racePositions.length > 1 && "💪 Keep pushing!"}
          </div>
        )}
      </div>
    </div>
  );
}

