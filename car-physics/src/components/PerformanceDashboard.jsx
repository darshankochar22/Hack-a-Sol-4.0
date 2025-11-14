import { useMemo } from "react";

export function PerformanceDashboard({ players, playerId, myScore, myLaps, mySpeed, myPosition }) {
  // Calculate all players' performance including self
  const allPlayersPerformance = useMemo(() => {
    const allPlayers = [
      {
        playerId: playerId,
        score: myScore || 0,
        laps: myLaps || 0,
        speed: mySpeed || 0,
        position: myPosition || [0, 0, 0],
        isMe: true,
      },
    ];

    // Add other players
    if (players) {
      Object.entries(players).forEach(([id, data]) => {
        allPlayers.push({
          playerId: id,
          score: data.score || 0,
          laps: data.laps || 0,
          speed: data.speed || 0,
          position: data.position || [0, 0, 0],
          isMe: false,
        });
      });
    }

    // Calculate track progress for sorting
    const playersWithProgress = allPlayers.map((player) => {
      const [, , z] = player.position;
      const trackProgress = z || 0; // Simple progress based on Z position
      return {
        ...player,
        trackProgress,
      };
    });

    // Sort by performance (laps first, then score, then speed)
    playersWithProgress.sort((a, b) => {
      if (b.laps !== a.laps) return b.laps - a.laps;
      if (b.score !== a.score) return b.score - a.score;
      return b.speed - a.speed;
    });

    return playersWithProgress;
  }, [players, playerId, myScore, myLaps, mySpeed, myPosition]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (allPlayersPerformance.length === 0) return null;

    const totalLaps = allPlayersPerformance.reduce((sum, p) => sum + p.laps, 0);
    const totalScore = allPlayersPerformance.reduce((sum, p) => sum + p.score, 0);
    const avgSpeed = allPlayersPerformance.reduce((sum, p) => sum + p.speed, 0) / allPlayersPerformance.length;
    const leader = allPlayersPerformance[0];

    return {
      totalLaps,
      totalScore,
      avgSpeed,
      leader,
      playerCount: allPlayersPerformance.length,
    };
  }, [allPlayersPerformance]);

  if (allPlayersPerformance.length === 0) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "#888",
        }}
      >
        No performance data available
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      {/* Summary Stats */}
      {performanceMetrics && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "12px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              background: "rgba(0, 255, 0, 0.1)",
              border: "1px solid rgba(0, 255, 0, 0.3)",
              borderRadius: "8px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#888",
                marginBottom: "4px",
                textTransform: "uppercase",
              }}
            >
              Total Laps
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#00ff00",
              }}
            >
              {performanceMetrics.totalLaps}
            </div>
          </div>

          <div
            style={{
              background: "rgba(0, 255, 0, 0.1)",
              border: "1px solid rgba(0, 255, 0, 0.3)",
              borderRadius: "8px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#888",
                marginBottom: "4px",
                textTransform: "uppercase",
              }}
            >
              Avg Speed
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#00ffff",
              }}
            >
              {Math.round(performanceMetrics.avgSpeed * 10)} km/h
            </div>
          </div>

          <div
            style={{
              background: "rgba(0, 255, 0, 0.1)",
              border: "1px solid rgba(0, 255, 0, 0.3)",
              borderRadius: "8px",
              padding: "12px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "11px",
                color: "#888",
                marginBottom: "4px",
                textTransform: "uppercase",
              }}
            >
              Players
            </div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#ffaa00",
              }}
            >
              {performanceMetrics.playerCount}
            </div>
          </div>
        </div>
      )}

      {/* Leader Badge */}
      {performanceMetrics && performanceMetrics.leader && (
        <div
          style={{
            background: "linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 140, 0, 0.2) 100%)",
            border: "2px solid #ffaa00",
            borderRadius: "10px",
            padding: "15px",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: "32px",
              }}
            >
              🏆
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "#888",
                  marginBottom: "4px",
                }}
              >
                Current Leader
              </div>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: "bold",
                  color: "#ffaa00",
                }}
              >
                {performanceMetrics.leader.isMe
                  ? "YOU"
                  : `Player ${performanceMetrics.leader.playerId.slice(-6)}`}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "#aaa",
                  marginTop: "4px",
                }}
              >
                {performanceMetrics.leader.laps} laps •{" "}
                {performanceMetrics.leader.score.toLocaleString()} pts •{" "}
                {Math.round(performanceMetrics.leader.speed * 10)} km/h
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Table */}
      <div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: "bold",
            color: "#00ff00",
            marginBottom: "12px",
            paddingBottom: "8px",
            borderBottom: "1px solid rgba(0, 255, 0, 0.3)",
          }}
        >
          Live Performance
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {allPlayersPerformance.map((player, index) => {
            const position = index + 1;
            const isLeader = position === 1;

            return (
              <div
                key={player.playerId}
                style={{
                  background: player.isMe
                    ? "rgba(0, 255, 0, 0.15)"
                    : isLeader
                    ? "rgba(255, 170, 0, 0.1)"
                    : "rgba(0, 255, 0, 0.05)",
                  border: player.isMe
                    ? "2px solid #00ff00"
                    : isLeader
                    ? "1px solid rgba(255, 170, 0, 0.5)"
                    : "1px solid rgba(0, 255, 0, 0.2)",
                  borderRadius: "8px",
                  padding: "12px",
                  display: "grid",
                  gridTemplateColumns: "40px 1fr auto auto auto",
                  gap: "12px",
                  alignItems: "center",
                  transition: "all 0.2s ease",
                }}
              >
                {/* Position */}
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: isLeader ? "#ffaa00" : player.isMe ? "#00ff00" : "#fff",
                    textAlign: "center",
                  }}
                >
                  {position === 1 && "🥇"}
                  {position === 2 && "🥈"}
                  {position === 3 && "🥉"}
                  {position > 3 && `${position}.`}
                </div>

                {/* Player Name */}
                <div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "bold",
                      color: player.isMe ? "#00ff00" : "#fff",
                    }}
                  >
                    {player.isMe ? "YOU" : `Player ${player.playerId.slice(-6)}`}
                  </div>
                  {player.isMe && (
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#888",
                        marginTop: "2px",
                      }}
                    >
                      Your Performance
                    </div>
                  )}
                </div>

                {/* Laps */}
                <div
                  style={{
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#888",
                      marginBottom: "2px",
                    }}
                  >
                    Laps
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#00ffff",
                    }}
                  >
                    {player.laps}
                  </div>
                </div>

                {/* Score */}
                <div
                  style={{
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#888",
                      marginBottom: "2px",
                    }}
                  >
                    Score
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#00ff00",
                    }}
                  >
                    {player.score.toLocaleString()}
                  </div>
                </div>

                {/* Speed */}
                <div
                  style={{
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#888",
                      marginBottom: "2px",
                    }}
                  >
                    Speed
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "bold",
                      color: "#ffaa00",
                    }}
                  >
                    {Math.round(player.speed * 10)} km/h
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Performance Indicators */}
      <div
        style={{
          marginTop: "10px",
          padding: "12px",
          background: "rgba(0, 255, 0, 0.05)",
          border: "1px solid rgba(0, 255, 0, 0.2)",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            color: "#888",
            marginBottom: "8px",
            textTransform: "uppercase",
          }}
        >
          Performance Indicators
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "6px",
          }}
        >
          {allPlayersPerformance.map((player) => {
            const performanceScore = player.laps * 100 + player.score / 10 + player.speed * 0.1;
            const maxScore = Math.max(
              ...allPlayersPerformance.map(
                (p) => p.laps * 100 + p.score / 10 + p.speed * 0.1
              )
            );
            const percentage = maxScore > 0 ? (performanceScore / maxScore) * 100 : 0;

            return (
              <div key={player.playerId}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "4px",
                    fontSize: "11px",
                  }}
                >
                  <span style={{ color: player.isMe ? "#00ff00" : "#aaa" }}>
                    {player.isMe ? "YOU" : `Player ${player.playerId.slice(-6)}`}
                  </span>
                  <span style={{ color: "#888" }}>
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <div
                  style={{
                    height: "4px",
                    background: "rgba(0, 255, 0, 0.1)",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${percentage}%`,
                      background: player.isMe
                        ? "linear-gradient(90deg, #00ff00, #00cc00)"
                        : "linear-gradient(90deg, #00ffff, #00aaaa)",
                      borderRadius: "2px",
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

