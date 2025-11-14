/* global BigInt */
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { io } from "socket.io-client";
import { racingApi } from "../utils/racingApi";
import { getTradingEngineContract, placeBet } from "../utils/contracts";
import { LiveStandings } from "./LiveStandings";
import "./MarketsBoard.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5002";

const formatEth = (weiString = "0") => {
  try {
    const wei = BigInt(weiString);
    const ether = Number(wei) / 1e18;
    return ether.toFixed(4);
  } catch {
    // Fallback for environments without BigInt
    const num = parseFloat(weiString) || 0;
    return (num / 1e18).toFixed(4);
  }
};

const formatPercent = (value) => {
  return `${value.toFixed(1)}%`;
};

const formatMultiplier = (probability) => {
  if (probability <= 0) return "—";
  return `${(100 / probability).toFixed(2)}x`;
};

const getStatusColor = (isActive, isFinished) => {
  if (isFinished) return "#94a3b8";
  if (isActive) return "#22c55e";
  return "#f59e0b";
};

const getStatusLabel = (isActive, isFinished) => {
  if (isFinished) return "Finished";
  if (isActive) return "Live";
  return "Upcoming";
};

export function MarketsBoard({ onClose, provider, signer, account, isConnected, isFullPage = false }) {
  const [markets, setMarkets] = useState([]);
  const [selectedRaceId, setSelectedRaceId] = useState(null);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [betAmount, setBetAmount] = useState("0.001");
  const [selectedTokenId, setSelectedTokenId] = useState(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [raceData, setRaceData] = useState(null);
  const [telemetryData, setTelemetryData] = useState({}); // tokenId -> latest telemetry
  const socketRef = useRef(null);

  const refreshMarkets = useCallback(async () => {
    try {
      console.log("🔄 Fetching markets from backend...");
      const data = await racingApi.getMarkets();
      console.log("📊 Markets data received:", data);
      setMarkets(data || []);
      setIsLoading(false);
    } catch (error) {
      console.error("❌ Failed to fetch markets:", error);
      console.error("Error details:", error.message, error.stack);
      setIsLoading(false);
    }
  }, []);

  const loadMarketDetail = useCallback(async (raceId) => {
    try {
      const market = await racingApi.getMarket(raceId);
      setSelectedMarket(market);
      
      // Also fetch race data for live standings
      try {
        const race = await racingApi.getRace(raceId);
        setRaceData(race);
        
        // Fetch telemetry for all participants
        if (race && race.participantTokenIds) {
          const telemetryPromises = race.participantTokenIds.map(async (tokenId) => {
            try {
              const telemetry = await racingApi.getTelemetry(raceId, tokenId, 1);
              if (telemetry && telemetry.snapshots && telemetry.snapshots.length > 0) {
                return { tokenId, telemetry: telemetry.snapshots[0] };
              }
            } catch (err) {
              // Ignore errors for individual telemetry fetches
              console.warn(`Failed to fetch telemetry for token ${tokenId}:`, err);
            }
            return null;
          });
          
          const telemetryResults = await Promise.all(telemetryPromises);
          const telemetryMap = {};
          telemetryResults.forEach((result) => {
            if (result && result.telemetry) {
              telemetryMap[result.tokenId] = result.telemetry;
            }
          });
          setTelemetryData(telemetryMap);
        }
      } catch (error) {
        console.warn("Failed to load race data:", error);
      }
      
      // History can be loaded later if needed for charts
      // await racingApi.getMarketHistory(raceId, 200);
    } catch (error) {
      console.error("Failed to load market detail:", error);
    }
  }, []);

  useEffect(() => {
    refreshMarkets();
  }, [refreshMarkets]);

  useEffect(() => {
    if (selectedRaceId) {
      loadMarketDetail(selectedRaceId);
    } else {
      setRaceData(null);
      setTelemetryData({});
    }
  }, [selectedRaceId, loadMarketDetail]);

  // Set up polling for active races to update telemetry
  useEffect(() => {
    if (!selectedRaceId || !raceData || !raceData.isActive || raceData.isFinished) {
      return;
    }

    const pollInterval = setInterval(() => {
      loadMarketDetail(selectedRaceId);
    }, 3000); // Update every 3 seconds for active races
    
    return () => clearInterval(pollInterval);
  }, [selectedRaceId, raceData, loadMarketDetail]);

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

    socket.on("bettingUpdated", () => {
      refreshMarkets();
      if (selectedRaceId) {
        loadMarketDetail(selectedRaceId);
      }
    });

    socket.on("raceCreated", refreshMarkets);
    socket.on("raceFinished", refreshMarkets);

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshMarkets, selectedRaceId, loadMarketDetail]);

  const handlePlaceBet = useCallback(async () => {
    if (!isConnected || !signer || !selectedRaceId || !selectedTokenId) {
      alert("Please connect wallet and select a car");
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount < 0.001) {
      alert("Minimum bet is 0.001 ETH");
      return;
    }

    setIsPlacingBet(true);
    try {
      // Get the contract instance with signer
      const tradingEngine = getTradingEngineContract(signer);
      
      // Place bet on the contract
      console.log(`Placing bet: ${betAmount} ETH on Car #${selectedTokenId} in Race #${selectedRaceId}`);
      const tx = await placeBet(
        tradingEngine,
        signer,
        selectedRaceId,
        selectedTokenId,
        amount
      );

      console.log("Bet transaction confirmed:", tx.hash);

      // Show success message
      alert(`✅ Bet placed successfully!\n\nAmount: ${betAmount} ETH\nCar: #${selectedTokenId}\nRace: #${selectedRaceId}\nTransaction: ${tx.hash}`);

      // Reset form
      setBetAmount("0.001");
      setSelectedTokenId(null);

      // Refresh market data
      await refreshMarkets();
      if (selectedRaceId) {
        await loadMarketDetail(selectedRaceId);
      }
    } catch (error) {
      console.error("Bet placement error:", error);
      
      // Handle specific error cases
      if (error.message && error.message.includes("user rejected")) {
        alert("❌ Transaction cancelled by user");
      } else if (error.message && error.message.includes("insufficient funds")) {
        alert("❌ Insufficient funds. Please ensure you have enough ETH in your wallet.");
      } else if (error.message && error.message.includes("not set")) {
        alert("❌ Contract address not configured. Please set REACT_APP_TRADING_ENGINE_ADDRESS environment variable.");
      } else {
        alert("❌ Failed to place bet: " + (error.message || error.toString()));
      }
    } finally {
      setIsPlacingBet(false);
    }
  }, [isConnected, signer, selectedRaceId, selectedTokenId, betAmount, refreshMarkets, loadMarketDetail]);

  const totalLiquidity = useMemo(() => {
    return markets.reduce((sum, market) => {
      return sum + parseFloat(formatEth(market.totalPoolWei));
    }, 0);
  }, [markets]);

  const activeMarkets = useMemo(() => {
    return markets.filter((m) => m.isActive && !m.isFinished);
  }, [markets]);

  // Convert race data to competitors format for LiveStandings component
  const competitorsForStandings = useMemo(() => {
    if (!raceData || !raceData.participantTokenIds || raceData.participantTokenIds.length === 0) {
      return [];
    }

    const participants = raceData.participantTokenIds.map(tokenId => {
      const telemetry = telemetryData[tokenId];
      const isBot = raceData.botTokenIds?.includes(tokenId) || false;
      
      // Calculate distance based on lap and lap progress
      const totalDistance = ((telemetry?.currentLap || 0) * (selectedMarket?.totalLaps || 10) * 100) + 
                             ((telemetry?.lapProgress || 0) / 100 * (selectedMarket?.totalLaps || 10) * 100);
      
      return {
        tokenId,
        name: isBot ? `Bot #${tokenId}` : `Car #${tokenId}`,
        speed: telemetry?.speed || 0,
        distance: totalDistance,
        currentLap: telemetry?.currentLap || 0,
        lapProgress: telemetry?.lapProgress || 0,
        isBot,
        isPlayer: !isBot && account, // Assume non-bots are players for now
      };
    }).sort((a, b) => {
      // Sort by lap (descending), then by lap progress (descending), then by speed (descending)
      if (b.currentLap !== a.currentLap) return b.currentLap - a.currentLap;
      if (b.lapProgress !== a.lapProgress) return b.lapProgress - a.lapProgress;
      return (b.speed || 0) - (a.speed || 0);
    }).map((participant, index) => ({
      ...participant,
      position: index + 1,
    }));

    return participants;
  }, [raceData, telemetryData, selectedMarket, account]);

  return (
    <div className={`markets-board-overlay ${isFullPage ? "full-page" : ""}`}>
      <div className={`markets-board-container ${isFullPage ? "full-page" : ""}`}>
        <div className="markets-board-header">
          <div>
            <h2>🏎️ Race Markets</h2>
            <p>Bet on AI-powered F1 races</p>
          </div>
          <div className="markets-board-actions">
            <button className="ghost-btn" onClick={refreshMarkets}>
              ↻ Refresh
            </button>
            {onClose && (
              <button className="close-btn" onClick={onClose}>
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="markets-stats-bar">
          <div className="stat-item">
            <span className="stat-label">Total Markets</span>
            <span className="stat-value">{markets.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active</span>
            <span className="stat-value">{activeMarkets.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Liquidity</span>
            <span className="stat-value">{formatEth(String(totalLiquidity * 1e18))} ETH</span>
          </div>
        </div>

        {isLoading ? (
          <div className="markets-loading">Loading markets...</div>
        ) : markets.length === 0 ? (
          <div className="markets-empty">
            <p>No markets available</p>
            <span>Races will appear here once created on-chain</span>
            <div style={{ marginTop: "20px", padding: "16px", background: "rgba(59, 130, 246, 0.1)", borderRadius: "8px", fontSize: "14px" }}>
              <strong>💡 To create a race:</strong>
              <ol style={{ marginTop: "8px", paddingLeft: "20px", textAlign: "left" }}>
                <li>Make sure Hardhat node is running</li>
                <li>Run: <code style={{ background: "rgba(0,0,0,0.3)", padding: "2px 6px", borderRadius: "4px" }}>node backend/scripts/create-test-race.js</code></li>
                <li>Refresh this page</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="markets-content">
            <div className="markets-list">
              <div className="markets-table-header">
                <div className="col-race">Race</div>
                <div className="col-status">Status</div>
                <div className="col-pool">Pool</div>
                <div className="col-standings">Live Standings</div>
                <div className="col-options">Options</div>
                <div className="col-action">Action</div>
              </div>

              <div className="markets-table-body">
                {markets.map((market) => {
                  const statusColor = getStatusColor(market.isActive, market.isFinished);
                  const statusLabel = getStatusLabel(market.isActive, market.isFinished);
                  const poolEth = formatEth(market.totalPoolWei);
                  const topMarket = market.markets.sort(
                    (a, b) => b.impliedProbability - a.impliedProbability
                  )[0];

                  return (
                    <div
                      key={market.raceId}
                      className={`market-row ${selectedRaceId === market.raceId ? "selected" : ""}`}
                      onClick={() => setSelectedRaceId(market.raceId)}
                    >
                      <div className="col-race">
                        <div className="race-id">Race #{market.raceId}</div>
                        <div className="race-meta">
                          {market.totalLaps} laps • {market.markets.length} cars
                        </div>
                      </div>
                      <div className="col-status">
                        <span
                          className="status-badge"
                          style={{ backgroundColor: statusColor }}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <div className="col-pool">
                        <div className="pool-amount">{poolEth} ETH</div>
                        {topMarket && (
                          <div className="pool-top">
                            Top: {formatPercent(topMarket.impliedProbability)}
                          </div>
                        )}
                      </div>
                      <div className="col-options">
                        {market.markets.slice(0, 3).map((m) => (
                          <div key={m.tokenId} className="option-chip">
                            #{m.tokenId} {formatPercent(m.impliedProbability)}
                          </div>
                        ))}
                        {market.markets.length > 3 && (
                          <div className="option-chip more">
                            +{market.markets.length - 3}
                          </div>
                        )}
                      </div>
                      <div className="col-action">
                        <button
                          className="view-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRaceId(market.raceId);
                          }}
                        >
                          View
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {selectedMarket && (
              <div className="market-detail-panel">
                <div className="panel-header">
                  <h3>Race #{selectedMarket.raceId} Market</h3>
                  <button
                    className="close-detail-btn"
                    onClick={() => {
                      setSelectedRaceId(null);
                      setSelectedMarket(null);
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div className="market-detail-content">
                  <div className="market-info">
                    <div className="info-item">
                      <span>Status</span>
                      <span
                        className="status-badge"
                        style={{
                          backgroundColor: getStatusColor(
                            selectedMarket.isActive,
                            selectedMarket.isFinished
                          ),
                        }}
                      >
                        {getStatusLabel(selectedMarket.isActive, selectedMarket.isFinished)}
                      </span>
                    </div>
                    <div className="info-item">
                      <span>Total Pool</span>
                      <span>{formatEth(selectedMarket.totalPoolWei)} ETH</span>
                    </div>
                    <div className="info-item">
                      <span>Total Laps</span>
                      <span>{selectedMarket.totalLaps}</span>
                    </div>
                  </div>

                  {/* Live Race Standings */}
                  {competitorsForStandings.length > 0 && (
                    <div style={{ marginTop: "24px", marginBottom: "24px" }}>
                      <LiveStandings
                        competitors={competitorsForStandings}
                        raceTime={raceData?.startTime ? Math.floor((Date.now() - raceData.startTime * 1000) / 1000) : 0}
                        raceDuration={selectedMarket?.totalLaps ? selectedMarket.totalLaps * 60 : 600} // Approximate duration based on laps
                      />
                    </div>
                  )}

                  <div className="market-options">
                    <h4>Betting Options</h4>
                    <div className="options-grid">
                      {selectedMarket.markets.map((option) => (
                        <div
                          key={option.tokenId}
                          className={`option-card ${selectedTokenId === option.tokenId ? "selected" : ""}`}
                          onClick={() => setSelectedTokenId(option.tokenId)}
                        >
                          <div className="option-header">
                            <span className="option-label">
                              Car #{option.tokenId}
                              {option.isBot && <span className="bot-badge">BOT</span>}
                            </span>
                            <span className="option-probability">
                              {formatPercent(option.impliedProbability)}
                            </span>
                          </div>
                          <div className="option-details">
                            <div className="detail-row">
                              <span>Multiplier</span>
                              <span>{formatMultiplier(option.impliedProbability)}</span>
                            </div>
                            <div className="detail-row">
                              <span>Total Bet</span>
                              <span>{formatEth(option.betTotalWei)} ETH</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {!selectedMarket.isFinished && (
                    <div className="betting-panel">
                      <h4>Place Bet</h4>
                      {!isConnected ? (
                        <div className="betting-connect">
                          <p>Connect wallet to place bets</p>
                        </div>
                      ) : (
                        <div className="betting-form">
                          <div className="form-group">
                            <label>Selected Car</label>
                            <div className="selected-car-display">
                              {selectedTokenId ? (
                                <span>Car #{selectedTokenId}</span>
                              ) : (
                                <span className="placeholder">Select a car above</span>
                              )}
                            </div>
                          </div>
                          <div className="form-group">
                            <label>Bet Amount (ETH)</label>
                            <input
                              type="number"
                              min="0.001"
                              step="0.001"
                              value={betAmount}
                              onChange={(e) => setBetAmount(e.target.value)}
                              placeholder="0.001"
                            />
                          </div>
                          {selectedTokenId && selectedMarket.markets.find((m) => m.tokenId === selectedTokenId) && (
                            <div className="betting-preview">
                              <div className="preview-row">
                                <span>Potential Payout</span>
                                <span>
                                  {formatEth(
                                    String(
                                      (parseFloat(betAmount) *
                                        (100 /
                                          selectedMarket.markets.find(
                                            (m) => m.tokenId === selectedTokenId
                                          ).impliedProbability)) *
                                        1e18
                                    )
                                  )}{" "}
                                  ETH
                                </span>
                              </div>
                            </div>
                          )}
                          <button
                            className="bet-btn"
                            onClick={handlePlaceBet}
                            disabled={!selectedTokenId || isPlacingBet || selectedMarket.isFinished}
                          >
                            {isPlacingBet ? "Placing..." : "Place Bet"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

