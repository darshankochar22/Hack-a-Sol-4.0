/* global BigInt */
import { useState, useEffect, useMemo } from "react";
import { useRace } from "../contexts/RaceContext";
import { racingApi } from "../utils/racingApi";
import "./RaceAnalyticsPage.css";

export function RaceAnalyticsPage() {
  const { competitors, raceTime, raceDuration, isRaceActive, activeRaceId } = useRace();
  const [raceHistory, setRaceHistory] = useState([]);
  const [selectedRaceId, setSelectedRaceId] = useState(null);
  const [raceData, setRaceData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Collect race history data during active race
  useEffect(() => {
    if (!isRaceActive || competitors.length === 0) return;

    const interval = setInterval(() => {
      setRaceHistory((prev) => [
        ...prev,
        {
          timestamp: raceTime,
          competitors: competitors.map((c) => ({
            tokenId: c.tokenId,
            name: c.name,
            position: c.position,
            speed: c.speed,
            distance: c.distance,
            isPlayer: c.isPlayer,
          })),
        },
      ]);
    }, 1000); // Record every second

    return () => clearInterval(interval);
  }, [isRaceActive, competitors, raceTime]);

  // Load race data from backend
  useEffect(() => {
    if (selectedRaceId) {
      setIsLoading(true);
      racingApi
        .getRace(selectedRaceId)
        .then((data) => {
          setRaceData(data);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Failed to load race data:", error);
          setIsLoading(false);
        });
    }
  }, [selectedRaceId]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (raceHistory.length === 0) return null;

    const stats = {};
    competitors.forEach((comp) => {
      const history = raceHistory.map((h) =>
        h.competitors.find((c) => c.tokenId === comp.tokenId)
      );
      const speeds = history.map((h) => h?.speed || 0).filter((s) => s > 0);
      const distances = history.map((h) => h?.distance || 0);
      const positions = history.map((h) => h?.position || 999);

      stats[comp.tokenId] = {
        name: comp.name,
        isPlayer: comp.isPlayer,
        avgSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
        maxSpeed: speeds.length > 0 ? Math.max(...speeds) : 0,
        minSpeed: speeds.length > 0 ? Math.min(...speeds) : 0,
        totalDistance: distances.length > 0 ? Math.max(...distances) : 0,
        bestPosition: positions.length > 0 ? Math.min(...positions) : 999,
        worstPosition: positions.length > 0 ? Math.max(...positions) : 1,
        finalPosition: comp.position,
        points: comp.points || 0,
        speedHistory: speeds,
        positionHistory: positions,
        distanceHistory: distances,
      };
    });

    return stats;
  }, [raceHistory, competitors]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (raceHistory.length === 0) return null;

    return {
      time: raceHistory.map((h) => h.timestamp),
      speeds: competitors.map((comp) => ({
        name: comp.name,
        data: raceHistory.map((h) => {
          const c = h.competitors.find((c) => c.tokenId === comp.tokenId);
          return c?.speed || 0;
        }),
        color: comp.isPlayer ? "#22c55e" : "#3b82f6",
      })),
      positions: competitors.map((comp) => ({
        name: comp.name,
        data: raceHistory.map((h) => {
          const c = h.competitors.find((c) => c.tokenId === comp.tokenId);
          return c?.position || 999;
        }),
        color: comp.isPlayer ? "#22c55e" : "#3b82f6",
      })),
      distances: competitors.map((comp) => ({
        name: comp.name,
        data: raceHistory.map((h) => {
          const c = h.competitors.find((c) => c.tokenId === comp.tokenId);
          return c?.distance || 0;
        }),
        color: comp.isPlayer ? "#22c55e" : "#3b82f6",
      })),
    };
  }, [raceHistory, competitors]);

  if (!isRaceActive && raceHistory.length === 0) {
    return (
      <div className="race-analytics-page">
        <div className="analytics-header">
          <h1>🏎️ Race Analytics Dashboard</h1>
          <p>Start a race to see live analytics and statistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="race-analytics-page">
      <div className="analytics-header">
        <h1>🏎️ Race Analytics Dashboard</h1>
        {isRaceActive && (
          <div className="race-status">
            <span className="status-badge live">LIVE</span>
            <span>Time: {raceTime}s / {raceDuration}s</span>
          </div>
        )}
      </div>

      {statistics && (
        <>
          {/* Statistics Cards */}
          <div className="stats-grid">
            {Object.values(statistics).map((stat) => (
              <div key={stat.name} className={`stat-card ${stat.isPlayer ? "player" : ""}`}>
                <div className="stat-header">
                  <h3>{stat.name}</h3>
                  {stat.isPlayer && <span className="player-badge">YOU</span>}
                </div>
                <div className="stat-content">
                  <div className="stat-row">
                    <span>Final Position:</span>
                    <span className="stat-value">{stat.finalPosition}</span>
                  </div>
                  <div className="stat-row">
                    <span>Points:</span>
                    <span className="stat-value">{stat.points}</span>
                  </div>
                  <div className="stat-row">
                    <span>Avg Speed:</span>
                    <span className="stat-value">{Math.round(stat.avgSpeed)} km/h</span>
                  </div>
                  <div className="stat-row">
                    <span>Max Speed:</span>
                    <span className="stat-value">{Math.round(stat.maxSpeed)} km/h</span>
                  </div>
                  <div className="stat-row">
                    <span>Total Distance:</span>
                    <span className="stat-value">{stat.totalDistance.toFixed(1)}m</span>
                  </div>
                  <div className="stat-row">
                    <span>Best Position:</span>
                    <span className="stat-value">{stat.bestPosition}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          {chartData && (
            <div className="charts-section">
              <h2>Race Progression Charts</h2>

              {/* Speed Chart */}
              <div className="chart-container">
                <h3>Speed Over Time</h3>
                <div className="chart">
                  <svg viewBox="0 0 800 300" className="chart-svg">
                    {chartData.speeds.map((car, idx) => (
                      <g key={car.name}>
                        <polyline
                          points={chartData.time
                            .map((t, i) => {
                              const x = (t / raceDuration) * 800;
                              const y = 300 - (car.data[i] / 200) * 250; // Scale to 0-200 km/h
                              return `${x},${y}`;
                            })
                            .join(" ")}
                          fill="none"
                          stroke={car.color}
                          strokeWidth="2"
                        />
                        <text
                          x="10"
                          y={20 + idx * 20}
                          fill={car.color}
                          fontSize="12"
                        >
                          {car.name}
                        </text>
                      </g>
                    ))}
                    <line x1="0" y1="300" x2="800" y2="300" stroke="#666" strokeWidth="1" />
                    <line x1="0" y1="300" x2="0" y2="0" stroke="#666" strokeWidth="1" />
                  </svg>
                </div>
              </div>

              {/* Position Chart */}
              <div className="chart-container">
                <h3>Position Over Time</h3>
                <div className="chart">
                  <svg viewBox="0 0 800 300" className="chart-svg">
                    {chartData.positions.map((car, idx) => (
                      <g key={car.name}>
                        <polyline
                          points={chartData.time
                            .map((t, i) => {
                              const x = (t / raceDuration) * 800;
                              const y = (car.data[i] / competitors.length) * 250; // Scale by number of competitors
                              return `${x},${y}`;
                            })
                            .join(" ")}
                          fill="none"
                          stroke={car.color}
                          strokeWidth="2"
                        />
                        <text
                          x="10"
                          y={20 + idx * 20}
                          fill={car.color}
                          fontSize="12"
                        >
                          {car.name}
                        </text>
                      </g>
                    ))}
                    <line x1="0" y1="0" x2="800" y2="0" stroke="#666" strokeWidth="1" />
                    <line x1="0" y1="0" x2="0" y2="300" stroke="#666" strokeWidth="1" />
                  </svg>
                </div>
              </div>

              {/* Distance Chart */}
              <div className="chart-container">
                <h3>Distance Over Time</h3>
                <div className="chart">
                  <svg viewBox="0 0 800 300" className="chart-svg">
                    {chartData.distances.map((car, idx) => {
                      const maxDistance = Math.max(...car.data);
                      return (
                        <g key={car.name}>
                          <polyline
                            points={chartData.time
                              .map((t, i) => {
                                const x = (t / raceDuration) * 800;
                                const y = 300 - (car.data[i] / maxDistance) * 250;
                                return `${x},${y}`;
                              })
                              .join(" ")}
                            fill="none"
                            stroke={car.color}
                            strokeWidth="2"
                          />
                          <text
                            x="10"
                            y={20 + idx * 20}
                            fill={car.color}
                            fontSize="12"
                          >
                            {car.name}
                          </text>
                        </g>
                      );
                    })}
                    <line x1="0" y1="300" x2="800" y2="300" stroke="#666" strokeWidth="1" />
                    <line x1="0" y1="300" x2="0" y2="0" stroke="#666" strokeWidth="1" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

