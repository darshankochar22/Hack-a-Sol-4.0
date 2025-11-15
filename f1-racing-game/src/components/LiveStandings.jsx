import { useMemo, useState } from "react";
import "./LiveStandings.css";

export function LiveStandings({ competitors = [], raceTime = 0, raceDuration = 60 }) {
  const [isVisible, setIsVisible] = useState(true);

  const sortedCompetitors = useMemo(() => {
    // Use the position already calculated in RaceContext (based on distance and laps)
    // This ensures consistency with the actual race positions
    return [...competitors].sort((a, b) => {
      // Primary sort: position (already calculated in RaceContext based on distance and laps)
      if (a.position !== b.position) {
        return (a.position || 999) - (b.position || 999);
      }
      // Fallback: sort by distance if positions are equal
      if (b.distance !== a.distance) {
        return (b.distance || 0) - (a.distance || 0);
      }
      // Tertiary: sort by speed
      return (b.speed || 0) - (a.speed || 0);
    });
  }, [competitors]);

  const timeRemaining = Math.max(0, raceDuration - raceTime);
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = Math.floor(timeRemaining % 60);
  const timeDisplay = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <>
      {/* Toggle Button */}
      <button
        className={`standings-toggle-btn ${isVisible ? 'panel-visible' : ''}`}
        onClick={() => setIsVisible(!isVisible)}
        title={isVisible ? "Hide Standings" : "Show Standings"}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      </button>

      {isVisible && (
        <div className="live-standings">
          <div className="standings-header">
            <h3>LIVE STANDINGS</h3>
            <div className="standings-header-right">
              <div className="race-timer">
                <span className="timer-label">Time Remaining</span>
                <span className="timer-value">{timeDisplay}</span>
              </div>
              <button
                className="close-standings-btn"
                onClick={() => setIsVisible(false)}
                title="Close Standings"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
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
                {(competitor.distance !== undefined && competitor.distance !== null) 
                  ? `${competitor.distance.toFixed(1)}m` 
                  : "0.0m"}
              </div>
              <div className="col-time">
                {competitor.time ? `${Math.floor(competitor.time / 60)}:${String(Math.floor(competitor.time % 60)).padStart(2, '0')}` : `${Math.floor(raceTime / 60)}:${String(Math.floor(raceTime % 60)).padStart(2, '0')}`}
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
      )}
    </>
  );
}

