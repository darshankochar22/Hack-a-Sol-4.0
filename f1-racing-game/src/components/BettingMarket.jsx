import { useState, useEffect, useCallback } from "react";
import { carConfigs } from "../config/carConfigs";
import { 
  getRacePool, 
  getOdds, 
  getUserBets,
  placeBet as placeBetContract,
  getTradingEngineContract
} from "../utils/contracts";
import { ethers } from "ethers";
import "./BettingMarket.css";

export function BettingMarket({ 
  raceData = {}, 
  provider = null,
  signer = null,
  isConnected = false,
  account = null,
  racers = [] // Array of racer objects with tokenId, carType, stats
}) {
  const [selectedCar, setSelectedCar] = useState(null);
  const [betAmount, setBetAmount] = useState(0.001);
  const [odds, setOdds] = useState({});
  const [totalPool, setTotalPool] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("markets");
  const [activeRaceId] = useState(null);
  const [userBets, setUserBets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [participants, setParticipants] = useState([]);

  // Fetch active race pool and participants
  useEffect(() => {
    const fetchRaceData = async () => {
      if (!provider || !isConnected) return;

      try {
        const tradingEngine = getTradingEngineContract(provider);

        // Find active race (in production, you'd have a way to get active race ID)
        // For now, we'll use racers from props or fetch from contract
        if (racers.length > 0) {
          // Use racers from props
          setParticipants(racers.map(r => ({
            tokenId: r.tokenId,
            carType: r.carType || "ferrari",
            name: r.name || `${carConfigs[r.carType]?.name || "Racer"} #${r.tokenId}`
          })));
        } else {
          // Fetch from contract if no racers provided
          // This would require additional contract methods
          console.warn("No racers provided. Please provide racers array.");
        }

        // If we have an active race ID, fetch pool data
        if (activeRaceId) {
          const pool = await getRacePool(tradingEngine, activeRaceId);
          if (pool && pool.isActive) {
            setTotalPool(Number(ethers.formatEther(pool.totalPool)));

            // Fetch odds for each participant
            const newOdds = {};
            for (const tokenId of pool.participatingTokenIds) {
              const oddsValue = await getOdds(tradingEngine, activeRaceId, tokenId);
              const percentage = (oddsValue / 100).toFixed(1);
              const impliedOdds = (10000 / oddsValue).toFixed(2);
              
              newOdds[tokenId] = {
                percentage,
                multiplier: impliedOdds,
                impliedOdds
              };
            }
            setOdds(newOdds);
          }
        }
      } catch (error) {
        console.error("Error fetching race data:", error);
      }
    };

    fetchRaceData();
    const interval = setInterval(fetchRaceData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [provider, isConnected, activeRaceId, racers]);

  // Fetch user bets
  useEffect(() => {
    const fetchUserBets = async () => {
      if (!provider || !account || !activeRaceId) return;

      try {
        const tradingEngine = getTradingEngineContract(provider);
        const bets = await getUserBets(tradingEngine, activeRaceId, account);
        setUserBets(bets);
      } catch (error) {
        console.error("Error fetching user bets:", error);
      }
    };

    if (activeTab === "my-bets") {
      fetchUserBets();
    }
  }, [provider, account, activeRaceId, activeTab]);

  const handleBet = useCallback(async () => {
    if (!selectedCar || !signer || !activeRaceId) return;
    if (betAmount < 0.001) {
      alert("Minimum bet is 0.001 ETH");
      return;
    }
    if (!isConnected) {
      alert("Please connect your wallet");
      return;
    }

    setLoading(true);
    try {
      const tradingEngine = getTradingEngineContract(signer);
      const tx = await placeBetContract(
        tradingEngine,
        signer,
        activeRaceId,
        selectedCar.tokenId,
        betAmount
      );
      
      alert(`Bet placed! Transaction: ${tx.hash}`);
      setBetAmount(0.001);
      setSelectedCar(null);
      
      // Refresh data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error placing bet:", error);
      if (error.message.includes("user rejected")) {
        alert("Transaction cancelled");
      } else {
        alert("Error placing bet: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedCar, betAmount, signer, activeRaceId, isConnected]);

  const formatEth = (amount) => {
    return typeof amount === 'number' ? amount.toFixed(4) : amount;
  };

  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <>
      <button 
        className="polymarket-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "✕" : "Markets"}
      </button>

      {isOpen && (
        <div className="polymarket-overlay">
          <div className="polymarket-container">
            {/* Header */}
            <div className="polymarket-header">
              <div className="header-left">
                <h1 className="polymarket-logo">TurboTradeX</h1>
                <span className="market-subtitle">F1 Racing Markets</span>
              </div>
              <div className="header-right">
                {account ? (
                  <div className="wallet-badge">
                    <div className="wallet-dot"></div>
                    {formatAddress(account)}
                  </div>
                ) : (
                  <button className="connect-wallet-btn" onClick={() => alert("Use the wallet connection in the main app")}>
                    Connect Wallet
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="polymarket-tabs">
              <button 
                className={`tab ${activeTab === "markets" ? "active" : ""}`}
                onClick={() => setActiveTab("markets")}
              >
                Markets
              </button>
              <button 
                className={`tab ${activeTab === "my-bets" ? "active" : ""}`}
                onClick={() => setActiveTab("my-bets")}
              >
                My Bets
              </button>
            </div>

            {/* Market Info Bar */}
            <div className="market-info-bar">
              <div className="info-item">
                <span className="info-label">Total Volume</span>
                <span className="info-value">{formatEth(totalPool)} ETH</span>
              </div>
              <div className="info-item">
                <span className="info-label">Active Markets</span>
                <span className="info-value">{participants.length}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status</span>
                <span className="info-value status-live">● Live</span>
              </div>
            </div>

            {/* Market Question */}
            <div className="market-question">
              <h2>Which car will win the F1 race?</h2>
              <p className="market-description">Real-time odds based on live race performance</p>
            </div>

            {/* Markets List */}
            {activeTab === "markets" && (
              <div className="markets-list">
                {participants.map((participant) => {
                  const carConfig = carConfigs[participant.carType];
                  const raceInfo = raceData[participant.tokenId] || {};
                  const carOdds = odds[participant.tokenId] || { 
                    percentage: "50.0", 
                    multiplier: "2.00",
                    impliedOdds: "2.00"
                  };
                  const isSelected = selectedCar?.tokenId === participant.tokenId;

                  return (
                    <div
                      key={participant.tokenId}
                      className={`market-card ${isSelected ? "selected" : ""}`}
                    >
                      <div className="market-card-header">
                        <div className="market-option">
                          <div 
                            className="option-indicator"
                            style={{ backgroundColor: carConfig.primaryColor }}
                          />
                          <div className="option-info">
                            <h3>{participant.name}</h3>
                            <div className="option-stats">
                              <span>Speed: {raceInfo.currentSpeed || 0} km/h</span>
                              <span>•</span>
                              <span>Lap {raceInfo.currentLap || 0}/{raceInfo.totalLaps || 10}</span>
                              <span>•</span>
                              <span>P{raceInfo.position || "?"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="market-odds">
                          <div className="odds-main">
                            <span className="odds-value">{carOdds.percentage}%</span>
                            <span className="odds-label">Yes</span>
                          </div>
                          <div className="odds-price">
                            <span className="price-value">${carOdds.impliedOdds}</span>
                            <span className="price-label">per share</span>
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="bet-panel">
                          <div className="bet-input-group">
                            <label>Amount to bet</label>
                            <div className="input-wrapper">
                              <input
                                type="number"
                                min="0.001"
                                step="0.001"
                                value={betAmount}
                                onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
                                className="bet-input"
                                placeholder="0.001"
                              />
                              <span className="input-suffix">ETH</span>
                            </div>
                          </div>
                          <div className="bet-summary">
                            <div className="summary-row">
                              <span>Cost</span>
                              <span>{formatEth(betAmount)} ETH</span>
                            </div>
                            <div className="summary-row">
                              <span>Potential Payout</span>
                              <span className="payout-value">
                                {formatEth(betAmount * parseFloat(carOdds.multiplier))} ETH
                              </span>
                            </div>
                            <div className="summary-row highlight">
                              <span>Potential Profit</span>
                              <span className="profit-value">
                                +{formatEth((betAmount * parseFloat(carOdds.multiplier)) - betAmount)} ETH
                              </span>
                            </div>
                          </div>
                          <button
                            className="bet-button"
                            onClick={handleBet}
                            disabled={!isConnected || betAmount < 0.001 || loading || !activeRaceId}
                          >
                            {loading 
                              ? "Processing..." 
                              : !activeRaceId 
                                ? "No Active Race"
                                : isConnected 
                                  ? `Buy ${carOdds.percentage}% for ${formatEth(betAmount)} ETH` 
                                  : "Connect Wallet to Bet"}
                          </button>
                        </div>
                      )}

                      {!isSelected && (
                        <button
                          className="select-market-btn"
                          onClick={() => setSelectedCar(participant)}
                        >
                          Buy {carOdds.percentage}%
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "my-bets" && (
              <div className="my-bets-view">
                {userBets.length === 0 ? (
                  <div className="empty-state">
                    <p>No active bets</p>
                    <span>Your betting history will appear here</span>
                  </div>
                ) : (
                  <div className="bets-list">
                    {userBets.map((bet, index) => {
                      const racer = participants.find(p => p.tokenId === bet.tokenId);
                      return (
                        <div key={index} className="bet-item">
                          <div className="bet-item-header">
                            <span>{racer?.name || `Racer #${bet.tokenId}`}</span>
                            <span className={`bet-status ${bet.claimed ? "claimed" : "active"}`}>
                              {bet.claimed ? "Claimed" : "Active"}
                            </span>
                          </div>
                          <div className="bet-item-details">
                            <div>Amount: {ethers.formatEther(bet.amount)} ETH</div>
                            <div>Date: {new Date(bet.timestamp * 1000).toLocaleString()}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
