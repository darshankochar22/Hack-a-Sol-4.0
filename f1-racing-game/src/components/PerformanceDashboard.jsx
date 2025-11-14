import { useState, useEffect } from "react";
import { carConfigs } from "../config/carConfigs";
import "./PerformanceDashboard.css";

export function PerformanceDashboard({ 
  racers = [], 
  raceData = {},
  raceMetrics = null,
  onClose 
}) {
  const [selectedRacer, setSelectedRacer] = useState(null);
  const [viewMode, setViewMode] = useState("overview"); // overview, stats, history

  // If no racer selected and we have racers, select first one
  useEffect(() => {
    if (!selectedRacer && racers.length > 0) {
      setSelectedRacer(racers[0]);
    }
  }, [racers, selectedRacer]);

  const getRacerInfo = (tokenId) => {
    return racers.find((r) => r.tokenId === tokenId);
  };

  const calculateWinRate = (wins, totalRaces) => {
    if (totalRaces === 0) return 0;
    return ((wins / totalRaces) * 100).toFixed(1);
  };

  const calculatePerformanceScore = (racer) => {
    if (!racer) return 0;
    const baseStats = (racer.speed + racer.handling + racer.acceleration) / 3;
    const winRate = racer.totalRaces > 0 ? (racer.wins / racer.totalRaces) * 100 : 0;
    const crashPenalty = racer.totalRaces > 0 ? (racer.crashes / racer.totalRaces) * 20 : 0;
    return Math.max(0, Math.min(100, baseStats + (winRate * 0.3) - crashPenalty));
  };

  if (racers.length === 0) {
    return (
      <div className="performance-dashboard-overlay">
        <div className="performance-dashboard-container">
          <div className="dashboard-header">
            <h2>Performance Dashboard</h2>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
          <div className="empty-state">
            <p>No racers found</p>
            <span>Mint or acquire racers to view performance data</span>
          </div>
        </div>
      </div>
    );
  }

  const currentRacer = selectedRacer ? getRacerInfo(selectedRacer.tokenId) : null;
  const liveData = selectedRacer ? raceData[selectedRacer.tokenId] : null;

  return (
    <div className="performance-dashboard-overlay">
      <div className="performance-dashboard-container">
        <div className="dashboard-header">
          <h2>Performance Dashboard</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Racer Selector */}
        <div className="racer-selector">
          {racers.map((racer) => {
            const carConfig = carConfigs[racer.carType] || carConfigs.ferrari;
            const isSelected = selectedRacer?.tokenId === racer.tokenId;
            const perfScore = calculatePerformanceScore(racer);

            return (
              <div
                key={racer.tokenId}
                className={`racer-card-mini ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedRacer(racer)}
              >
                <div
                  className="racer-color-bar"
                  style={{ backgroundColor: carConfig.primaryColor }}
                />
                <div className="racer-mini-info">
                  <div className="racer-mini-name">
                    {carConfig.name} #{racer.tokenId}
                  </div>
                  <div className="racer-mini-stats">
                    <span>Perf: {perfScore.toFixed(0)}%</span>
                    <span>•</span>
                    <span>Wins: {racer.wins}/{racer.totalRaces}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {currentRacer && (
          <>
            {/* View Mode Tabs */}
            <div className="dashboard-tabs">
              <button
                className={`tab ${viewMode === "overview" ? "active" : ""}`}
                onClick={() => setViewMode("overview")}
              >
                Overview
              </button>
              <button
                className={`tab ${viewMode === "stats" ? "active" : ""}`}
                onClick={() => setViewMode("stats")}
              >
                Stats
              </button>
              <button
                className={`tab ${viewMode === "history" ? "active" : ""}`}
                onClick={() => setViewMode("history")}
              >
                History
              </button>
            </div>

            {/* Overview Tab */}
            {viewMode === "overview" && (
              <div className="dashboard-content">
                <div className="overview-grid">
                  {/* Performance Score */}
                  <div className="metric-card large">
                    <div className="metric-label">Performance Score</div>
                    <div className="metric-value-large">
                      {calculatePerformanceScore(currentRacer).toFixed(1)}%
                    </div>
                    <div className="metric-bar">
                      <div
                        className="metric-bar-fill"
                        style={{
                          width: `${calculatePerformanceScore(currentRacer)}%`,
                          backgroundColor: currentRacer.primaryColor || "#ff0000",
                        }}
                      />
                    </div>
                  </div>

                  {/* Win Rate */}
                  <div className="metric-card">
                    <div className="metric-label">Win Rate</div>
                    <div className="metric-value">
                      {calculateWinRate(currentRacer.wins, currentRacer.totalRaces)}%
                    </div>
                    <div className="metric-subtext">
                      {currentRacer.wins} wins / {currentRacer.totalRaces} races
                    </div>
                  </div>

                  {/* Crash Rate */}
                  <div className="metric-card">
                    <div className="metric-label">Crash Rate</div>
                    <div className="metric-value">
                      {currentRacer.totalRaces > 0
                        ? ((currentRacer.crashes / currentRacer.totalRaces) * 100).toFixed(1)
                        : 0}%
                    </div>
                    <div className="metric-subtext">
                      {currentRacer.crashes} crashes
                    </div>
                  </div>

                  {/* Live Race Data */}
                  {liveData && liveData.isActive && (
                    <div className="metric-card live">
                      <div className="metric-label">
                        Live Race <span className="live-indicator">●</span>
                      </div>
                      <div className="live-stats">
                        <div className="live-stat-item">
                          <span>Speed</span>
                          <span className="live-value">{liveData.currentSpeed} km/h</span>
                        </div>
                        <div className="live-stat-item">
                          <span>Position</span>
                          <span className="live-value">P{liveData.position}</span>
                        </div>
                        <div className="live-stat-item">
                          <span>Lap</span>
                          <span className="live-value">
                            {liveData.currentLap}/{liveData.totalLaps || 10}
                          </span>
                        </div>
                        <div className="live-stat-item">
                          <span>Progress</span>
                          <span className="live-value">{liveData.lapProgress}%</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Racing Parameters */}
                  {(raceMetrics || (liveData && (liveData.leftTurns || liveData.rightTurns))) && (
                    <div className="metric-card">
                      <div className="metric-label">Racing Parameters</div>
                      <div className="racing-params">
                        <div className="param-item">
                          <span>Left Turns</span>
                          <span className="param-value">
                            {raceMetrics?.leftTurns || liveData?.leftTurns || 0}
                          </span>
                        </div>
                        <div className="param-item">
                          <span>Right Turns</span>
                          <span className="param-value">
                            {raceMetrics?.rightTurns || liveData?.rightTurns || 0}
                          </span>
                        </div>
                        <div className="param-item">
                          <span>Total Turns</span>
                          <span className="param-value">
                            {(raceMetrics?.leftTurns || liveData?.leftTurns || 0) + 
                             (raceMetrics?.rightTurns || liveData?.rightTurns || 0)}
                          </span>
                        </div>
                        <div className="param-item">
                          <span>Total Distance</span>
                          <span className="param-value">
                            {(raceMetrics?.totalDistance || liveData?.totalDistance || 0).toFixed(2)} m
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Speed Metrics */}
                  {(raceMetrics || (liveData && liveData.averageSpeed)) && (
                    <div className="metric-card">
                      <div className="metric-label">Speed Metrics</div>
                      <div className="speed-metrics">
                        <div className="speed-metric-item">
                          <span>Average</span>
                          <span className="speed-value">
                            {Math.round((raceMetrics?.averageSpeed || liveData?.averageSpeed || 0) * 10)} km/h
                          </span>
                        </div>
                        <div className="speed-metric-item">
                          <span>Maximum</span>
                          <span className="speed-value">
                            {Math.round((raceMetrics?.maxSpeed || liveData?.maxSpeed || 0) * 10)} km/h
                          </span>
                        </div>
                        <div className="speed-metric-item">
                          <span>Minimum</span>
                          <span className="speed-value">
                            {Math.round((raceMetrics?.minSpeed !== Infinity ? (raceMetrics?.minSpeed || liveData?.minSpeed || 0) : 0) * 10)} km/h
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stats Tab */}
            {viewMode === "stats" && (
              <div className="dashboard-content">
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-label">Speed</div>
                    <div className="stat-value-large">{currentRacer.speed}</div>
                    <div className="stat-bar-container">
                      <div
                        className="stat-bar-fill"
                        style={{
                          width: `${currentRacer.speed}%`,
                          backgroundColor: "#ef4444",
                        }}
                      />
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label">Handling</div>
                    <div className="stat-value-large">{currentRacer.handling}</div>
                    <div className="stat-bar-container">
                      <div
                        className="stat-bar-fill"
                        style={{
                          width: `${currentRacer.handling}%`,
                          backgroundColor: "#3b82f6",
                        }}
                      />
                    </div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-label">Acceleration</div>
                    <div className="stat-value-large">{currentRacer.acceleration}</div>
                    <div className="stat-bar-container">
                      <div
                        className="stat-bar-fill"
                        style={{
                          width: `${currentRacer.acceleration}%`,
                          backgroundColor: "#10b981",
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="comparison-section">
                  <h3>Performance Comparison</h3>
                  <div className="comparison-chart">
                    {racers.map((racer) => {
                      const carConfig = carConfigs[racer.carType] || carConfigs.ferrari;
                      const isCurrent = racer.tokenId === currentRacer.tokenId;
                      return (
                        <div key={racer.tokenId} className="comparison-item">
                          <div className="comparison-label">
                            <div
                              className="comparison-color"
                              style={{ backgroundColor: carConfig.primaryColor }}
                            />
                            {carConfig.name} #{racer.tokenId}
                            {isCurrent && <span className="current-badge">Current</span>}
                          </div>
                          <div className="comparison-bar">
                            <div
                              className="comparison-bar-fill"
                              style={{
                                width: `${calculatePerformanceScore(racer)}%`,
                                backgroundColor: carConfig.primaryColor,
                                opacity: isCurrent ? 1 : 0.6,
                              }}
                            />
                            <span className="comparison-value">
                              {calculatePerformanceScore(racer).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* History Tab */}
            {viewMode === "history" && (
              <div className="dashboard-content">
                <div className="history-stats">
                  <div className="history-card">
                    <div className="history-label">Total Races</div>
                    <div className="history-value">{currentRacer.totalRaces}</div>
                  </div>
                  <div className="history-card success">
                    <div className="history-label">Wins</div>
                    <div className="history-value">{currentRacer.wins}</div>
                  </div>
                  <div className="history-card danger">
                    <div className="history-label">Crashes</div>
                    <div className="history-value">{currentRacer.crashes}</div>
                  </div>
                  <div className="history-card">
                    <div className="history-label">Last Race</div>
                    <div className="history-value">
                      {currentRacer.lastRaceTime
                        ? new Date(currentRacer.lastRaceTime * 1000).toLocaleDateString()
                        : "Never"}
                    </div>
                  </div>
                </div>

                <div className="history-timeline">
                  <h3>Race History</h3>
                  {currentRacer.totalRaces === 0 ? (
                    <div className="empty-timeline">
                      <p>No race history yet</p>
                      <span>Complete races to see history</span>
                    </div>
                  ) : (
                    <div className="timeline-items">
                      {/* In a real app, this would show individual race results */}
                      <div className="timeline-item">
                        <div className="timeline-dot success" />
                        <div className="timeline-content">
                          <div className="timeline-title">Race #{currentRacer.totalRaces}</div>
                          <div className="timeline-details">
                            {currentRacer.wins > 0 ? "Winner" : "Participated"} •{" "}
                            {currentRacer.crashes > 0 && "Crashed"}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

