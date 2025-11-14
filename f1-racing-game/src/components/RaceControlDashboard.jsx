import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { racingApi } from "../utils/racingApi";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5002";
const colorPalette = [
  "#ef4444",
  "#f97316",
  "#facc15",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];

const trackBounds = {
  x: { min: -18, max: 18 },
  y: { min: -18, max: 18 },
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const parseCoord = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  // Contract stores scaled ints (approx). Normalize a bit.
  return parsed / 100;
};

const normalizePoint = (point) => {
  if (!point) {
    return { x: 50, y: 50 };
  }

  const clampedX = clamp(point.x ?? 0, trackBounds.x.min, trackBounds.x.max);
  const clampedY = clamp(point.y ?? 0, trackBounds.y.min, trackBounds.y.max);

  return {
    x:
      ((clampedX - trackBounds.x.min) /
        (trackBounds.x.max - trackBounds.x.min || 1)) *
      100,
    y:
      ((clampedY - trackBounds.y.min) /
        (trackBounds.y.max - trackBounds.y.min || 1)) *
      100,
  };
};

const parseWei = (weiString = "0") => {
  const value = Number(weiString);
  if (Number.isNaN(value)) {
    return 0;
  }
  return value;
};

const formatEth = (weiString = "0") =>
  (parseWei(weiString) / 1e18).toFixed(3);

export function RaceControlDashboard({ onClose }) {
  const [snapshot, setSnapshot] = useState({
    races: [],
    totalRaces: 0,
    activeRaces: 0,
    finishedRaces: 0,
    timestamp: null,
  });
  const [selectedRaceId, setSelectedRaceId] = useState(null);
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef(null);

  const refreshSnapshot = useCallback(async () => {
    try {
      const data = await racingApi.getDashboardSnapshot();
      setSnapshot({
        races: data.races || [],
        totalRaces: data.totalRaces || data.races?.length || 0,
        activeRaces: data.activeRaces || 0,
        finishedRaces: data.finishedRaces || 0,
        timestamp: data.timestamp || Date.now(),
      });
      setIsLoading(false);
      return data;
    } catch (error) {
      console.error("Dashboard snapshot error:", error);
      setIsLoading(false);
      return null;
    }
  }, []);

  const flattenParticipants = useMemo(() => {
    if (!snapshot?.races) return [];
    return snapshot.races.flatMap((race) =>
      race.participantTokenIds.map((tokenId) => ({
        raceId: race.raceId,
        tokenId,
        isBot: race.botTokenIds.includes(tokenId),
        isActive: race.isActive,
        isFinished: race.isFinished,
        totalLaps: race.totalLaps,
        winnerTokenId: race.winnerTokenId,
        bettingPool: race.bettingPool || null,
        startTime: race.startTime,
        endTime: race.endTime,
      }))
    );
  }, [snapshot]);

  const ensureSelection = useCallback(
    (data) => {
      if (selectedRaceId && selectedTokenId) {
        const exists = flattenParticipants.some(
          (participant) =>
            participant.raceId === selectedRaceId &&
            participant.tokenId === selectedTokenId
        );
        if (exists) return;
      }

      const firstParticipant =
        (data?.races || snapshot.races).flatMap((race) =>
          race.participantTokenIds.map((tokenId) => ({
            raceId: race.raceId,
            tokenId,
          }))
        )[0] || null;

      if (firstParticipant) {
        setSelectedRaceId(firstParticipant.raceId);
        setSelectedTokenId(firstParticipant.tokenId);
      }
    },
    [selectedRaceId, selectedTokenId, snapshot.races, flattenParticipants]
  );

  const fetchTelemetry = useCallback(
    async (raceId, tokenId) => {
      if (!raceId || !tokenId) {
        setTelemetry([]);
        return;
      }
      try {
        const data = await racingApi.getTelemetry(raceId, tokenId, 200);
        setTelemetry(data.snapshots || []);
      } catch (error) {
        console.error("Telemetry fetch error:", error);
        setTelemetry([]);
      }
    },
    []
  );

  useEffect(() => {
    refreshSnapshot().then((data) => ensureSelection(data));
  }, [refreshSnapshot, ensureSelection]);

  useEffect(() => {
    fetchTelemetry(selectedRaceId, selectedTokenId);
  }, [selectedRaceId, selectedTokenId, fetchTelemetry]);

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket"],
      autoConnect: false,
    });
    socketRef.current = socket;
    socket.connect();

    socket.on("connect", () => {
      socket.emit("subscribeDashboard");
    });

    socket.on("dashboardSnapshot", (data) => {
      setSnapshot({
        races: data.races || [],
        totalRaces: data.totalRaces || data.races?.length || 0,
        activeRaces: data.activeRaces || 0,
        finishedRaces: data.finishedRaces || 0,
        timestamp: data.timestamp || Date.now(),
      });
      ensureSelection(data);
    });

    const refreshOnEvent = () => {
      refreshSnapshot().then((data) => ensureSelection(data));
    };

    socket.on("raceCreated", refreshOnEvent);
    socket.on("raceFinished", refreshOnEvent);
    socket.on("bettingUpdated", refreshOnEvent);
    socket.on("bettingSettled", refreshOnEvent);

    return () => {
      socket.disconnect();
    };
  }, [ensureSelection, refreshSnapshot]);

  const selectedCar = useMemo(() => {
    if (!selectedRaceId || !selectedTokenId) return null;
    const race = snapshot.races.find((r) => r.raceId === selectedRaceId);
    if (!race) return null;
    return {
      race,
      tokenId: selectedTokenId,
      isBot: race.botTokenIds.includes(selectedTokenId),
      bettingPool: race.bettingPool || null,
    };
  }, [selectedRaceId, selectedTokenId, snapshot.races]);

  const latestTelemetry = telemetry.length
    ? telemetry[telemetry.length - 1]
    : null;

  const speedSparklinePath = useMemo(() => {
    if (!telemetry.length) return "";
    const maxSpeed =
      telemetry.reduce((max, point) => Math.max(max, point.speed || 0), 0) || 1;

    return telemetry
      .map((point, index) => {
        const x =
          telemetry.length > 1 ? (index / (telemetry.length - 1)) * 100 : 0;
        const y = 100 - ((point.speed || 0) / maxSpeed) * 100;
        return `${index === 0 ? "M" : "L"} ${x},${y}`;
      })
      .join(" ");
  }, [telemetry]);

  const liveMovements = useMemo(
    () => telemetry.slice(-6).reverse(),
    [telemetry]
  );

  const trail = useMemo(() => {
    if (!telemetry.length) return [];
    return telemetry.map((point) => ({
      x: parseCoord(point.positionX),
      y: parseCoord(point.positionY),
      timestamp: point.timestamp,
      speed: point.speed,
      lap: point.currentLap,
    }));
  }, [telemetry]);

  const trailPoints = useMemo(() => {
    if (!trail.length) return [];
    return trail.map((point) =>
      normalizePoint({ x: point.x, y: point.y })
    );
  }, [trail]);

  const stats = useMemo(() => {
    const totalBets = snapshot.races.reduce((sum, race) => {
      if (!race.bettingPool?.totalPool) return sum;
      return sum + parseWei(race.bettingPool.totalPool);
    }, 0);

    return {
      activeRaces: snapshot.activeRaces || 0,
      finishedRaces: snapshot.finishedRaces || 0,
      totalPoolEth: (totalBets / 1e18).toFixed(3),
      lastUpdate: snapshot.timestamp
        ? new Date(snapshot.timestamp).toLocaleTimeString()
        : "—",
    };
  }, [snapshot]);

  const formatSpeed = (value) =>
    Math.round(Math.max(0, value || 0)).toString().padStart(2, "0");

  return (
    <div className="race-dashboard-overlay">
      <div className="race-dashboard-container">
        <div className="race-dashboard-header">
          <div>
            <h2>Race Control Center</h2>
            <p>Live telemetry & fleet-wide insights</p>
          </div>
          <div className="race-dashboard-actions">
            <button className="ghost-btn" onClick={refreshSnapshot}>
              ↻ Refresh
            </button>
            <button className="close-btn" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="race-dashboard-empty">Loading live data…</div>
        ) : (
          <>
            <div className="race-dashboard-stats">
              <div className="stat-card">
                <span className="stat-label">Active Races</span>
                <span className="stat-value">{stats.activeRaces}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Finished Races</span>
                <span className="stat-value">{stats.finishedRaces}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Bets (ETH)</span>
                <span className="stat-value">{stats.totalPoolEth}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Last Update</span>
                <span className="stat-value">{stats.lastUpdate}</span>
              </div>
            </div>

            <div className="race-dashboard-content">
              <div className="race-map-panel">
                <div className="panel-header">
                  <h3>Track Radar</h3>
                  <span>{snapshot.activeRaces} live trackers</span>
                </div>
                <div className="race-map">
                  <div className="race-map-track" />
                  {trailPoints.length > 1 && (
                    <svg className="race-map-trail" viewBox="0 0 100 100">
                      <polyline
                        points={trailPoints
                          .map((point) => `${point.x},${point.y}`)
                          .join(" ")}
                      />
                    </svg>
                  )}
                  {flattenParticipants.map((participant) => {
                    const isSelected =
                      participant.raceId === selectedRaceId &&
                      participant.tokenId === selectedTokenId;
                    // Use latest telemetry point if this participant is selected; others default center
                    const point =
                      isSelected && trailPoints.length
                        ? trailPoints[trailPoints.length - 1]
                        : normalizePoint({ x: 0, y: 0 });
                    const color =
                      colorPalette[
                        participant.tokenId % colorPalette.length
                      ];
                    return (
                      <button
                        key={`${participant.raceId}-${participant.tokenId}`}
                        className={`race-map-dot ${
                          isSelected ? "active" : ""
                        }`}
                        style={{
                          left: `${point.x}%`,
                          top: `${point.y}%`,
                          backgroundColor: color,
                        }}
                        onClick={() => {
                          setSelectedRaceId(participant.raceId);
                          setSelectedTokenId(participant.tokenId);
                        }}
                      >
                        #{participant.tokenId}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="race-cars-panel">
                <div className="panel-header">
                  <h3>Fleet Overview</h3>
                  <span>{flattenParticipants.length} trackers</span>
                </div>

                <div className="race-car-list">
                  {flattenParticipants.map((participant) => {
                    const color =
                      colorPalette[
                        participant.tokenId % colorPalette.length
                      ];
                    const isSelected =
                      participant.raceId === selectedRaceId &&
                      participant.tokenId === selectedTokenId;
                    const badge = participant.isActive
                      ? "LIVE"
                      : participant.isFinished
                      ? "Finished"
                      : "Scheduled";
                    return (
                      <div
                        key={`${participant.raceId}-${participant.tokenId}`}
                        className={`race-car-card ${
                          isSelected ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedRaceId(participant.raceId);
                          setSelectedTokenId(participant.tokenId);
                        }}
                      >
                        <div
                          className="race-car-color"
                          style={{ backgroundColor: color }}
                        />
                        <div className="race-car-meta">
                          <div className="race-car-title">
                            Car #{participant.tokenId}
                            <span className="live-pill">{badge}</span>
                          </div>
                          <div className="race-car-subtitle">
                            Race #{participant.raceId} •{" "}
                            {participant.isBot ? "AI Bot" : "Player"}
                          </div>
                        </div>
                        <div className="race-car-distance">
                          Lap {participant.totalLaps || "?"}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {selectedCar && (
              <div className="race-car-detail">
                <div className="panel-header">
                  <h3>
                    Car #{selectedCar.tokenId} • Race #{selectedCar.race.raceId}
                  </h3>
                  <span>
                    {latestTelemetry
                      ? `Last update ${new Date(
                          latestTelemetry.timestamp
                        ).toLocaleTimeString()}`
                      : "Awaiting telemetry"}
                  </span>
                </div>

                <div className="detail-grid">
                  <div className="detail-card">
                    <span className="detail-label">Instant Speed</span>
                    <div className="detail-value">
                      {formatSpeed(latestTelemetry?.speed)} km/h
                    </div>
                    <span className="detail-subtext">
                      Avg{" "}
                      {formatSpeed(
                        telemetry.reduce(
                          (sum, point) => sum + (point.speed || 0),
                          0
                        ) / (telemetry.length || 1)
                      )}{" "}
                      • Max{" "}
                      {formatSpeed(
                        telemetry.reduce(
                          (max, point) => Math.max(max, point.speed || 0),
                          0
                        )
                      )}
                    </span>
                    <svg className="sparkline" viewBox="0 0 100 100">
                      <path d={speedSparklinePath} />
                    </svg>
                  </div>

                  <div className="detail-card">
                    <span className="detail-label">Race Status</span>
                    <div className="detail-value">
                      {selectedCar.race.isFinished
                        ? selectedCar.race.winnerTokenId === selectedCar.tokenId
                          ? "Winner"
                          : "Finished"
                        : selectedCar.race.isActive
                        ? "Live"
                        : "Pending"}
                    </div>
                    <span className="detail-subtext">
                      Laps {latestTelemetry?.currentLap || 0}/
                      {selectedCar.race.totalLaps || "—"}
                    </span>
                  </div>

                  <div className="detail-card">
                    <span className="detail-label">Betting Pool</span>
                    <div className="detail-value">
                      {formatEth(
                        selectedCar.race.bettingPool?.tokenBets?.[
                          selectedCar.tokenId
                        ]
                      )}{" "}
                      ETH
                    </div>
                    <span className="detail-subtext">
                      Total Pool{" "}
                      {formatEth(selectedCar.race.bettingPool?.totalPool)} ETH
                    </span>
                  </div>

                  <div className="detail-card">
                    <span className="detail-label">Acceleration</span>
                    <div className="detail-value">
                      {Math.round(
                        (latestTelemetry?.acceleration || 0) * 10
                      ) / 10}{" "}
                      u/s²
                    </div>
                    <span className="detail-subtext">
                      Lap progress {latestTelemetry?.lapProgress || 0}%
                    </span>
                  </div>
                </div>

                <div className="detail-lists">
                  <div className="live-feed">
                    <div className="panel-header">
                      <h4>Live Movement Feed</h4>
                      <span>Last {liveMovements.length} updates</span>
                    </div>
                    <div className="feed-list">
                      {liveMovements.length === 0 && (
                        <p className="feed-empty">No movement data yet</p>
                      )}
                      {liveMovements.map((movement) => {
                        const normalized = normalizePoint({
                          x: parseCoord(movement.positionX),
                          y: parseCoord(movement.positionY),
                        });
                        return (
                          <div key={movement.timestamp} className="feed-item">
                            <div>
                              <strong>
                                {formatSpeed(movement.speed)} km/h
                              </strong>{" "}
                              • Lap{" "}
                              {movement.currentLap ||
                                movement.lap ||
                                latestTelemetry?.currentLap ||
                                0}
                            </div>
                            <div className="feed-meta">
                              ({normalized.x.toFixed(1)}%,{" "}
                              {normalized.y.toFixed(1)}%) •{" "}
                              {movement.turnDirection || "straight"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="fleet-leaderboard">
                    <div className="panel-header">
                      <h4>Distance Leaders</h4>
                      <span>Betting focus</span>
                    </div>
                    <ul>
                      {snapshot.races.length === 0 && (
                        <li className="feed-empty">No races yet</li>
                      )}
                      {snapshot.races.slice(0, 3).map((race, index) => (
                        <li key={race.raceId}>
                          <span>
                            #{index + 1} • Race {race.raceId}
                          </span>
                          <span>
                            {formatEth(race.bettingPool?.totalPool)} ETH pool
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

