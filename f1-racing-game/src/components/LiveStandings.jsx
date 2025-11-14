import { useMemo } from "react";
import "./LiveStandings.css";

export function LiveStandings({ competitors = [], raceTime = 0, raceDuration = 60 }) {
  const sortedCompetitors = useMemo(() => {
    return [...competitors].sort((a, b) => {
      // Sort by distance (descending), then by speed
      if (b.distance !== a.distance) {
        return b.distance - a.distance;
      }
      return (b.speed || 0) - (a.speed || 0);
    });
  }, [competitors]);

  const timeRemaining = Math.max(0, raceDuration - raceTime);

  return (
    <div className="live-standings">
      <div className="standings-header">
        <h3>🏎️ Live Standings</h3>
        <div className="race-timer">
          <span className="timer-label">Time Remaining:</span>
          <span className="timer-value">{timeRemaining}s</span>
        </div>
      </div>

      <div className="standings-table">
        <div className="standings-row header">
          <div className="col-pos">Pos</div>
          <div className="col-name">Car</div>
          <div className="col-speed">Speed</div>
          <div className="col-distance">Distance</div>
          <div className="col-time">Time</div>
          <div className="col-points">Points</div>
        </div>

        {sortedCompetitors.map((competitor, index) => {
          const isPlayer = competitor.isPlayer;
          const position = competitor.position || index + 1;
          
          return (
            <div
              key={competitor.tokenId}
              className={`standings-row ${isPlayer ? "player" : ""} ${position <= 3 ? "podium" : ""}`}
            >
              <div className="col-pos">
                <span className={`position-badge position-${position}`}>
                  {position}
                  {position === 1 && " 🥇"}
                  {position === 2 && " 🥈"}
                  {position === 3 && " 🥉"}
                </span>
              </div>
              <div className="col-name">
                <span className="car-name">
                  {competitor.name}
                  {isPlayer && <span className="player-badge">YOU</span>}
                </span>
              </div>
              <div className="col-speed">
                {Math.round(competitor.speed || 0)} km/h
              </div>
              <div className="col-distance">
                {competitor.distance?.toFixed(1) || "0.0"}m
              </div>
              <div className="col-time">
                {competitor.time || raceTime}s
              </div>
              <div className="col-points">
                {competitor.points ? (
                  <span className="points-value">{competitor.points}</span>
                ) : (
                  <span className="points-pending">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

