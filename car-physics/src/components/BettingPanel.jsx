import { useState, useMemo } from "react";

export function BettingPanel({
  playerId,
  players,
  myScore,
  myLaps,
  mySpeed,
  myPosition,
  bettingHook,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [betAmount, setBetAmount] = useState(10);
  const [showBettingHistory, setShowBettingHistory] = useState(false);

  const {
    bets,
    totalPool,
    calculateOdds,
    placeBet,
    calculateWinnings,
    getAvailablePlayers,
    getPlayerStats,
  } = bettingHook;

  // Calculate odds (reactive to performance changes)
  const odds = useMemo(() => {
    return calculateOdds();
  }, [calculateOdds]);

  // Get available players
  const availablePlayers = useMemo(() => {
    return getAvailablePlayers();
  }, [getAvailablePlayers]);

  // Handle bet placement
  const handlePlaceBet = () => {
    if (!selectedPlayer) {
      alert("Please select a player to bet on");
      return;
    }
    if (betAmount <= 0) {
      alert("Bet amount must be greater than 0");
      return;
    }

    const success = placeBet(selectedPlayer, betAmount);
    if (success) {
      alert(`Bet placed! ${betAmount} points on Player ${selectedPlayer.slice(-6)}`);
      setSelectedPlayer(null);
      setBetAmount(10);
    }
  };

  // Get my bets
  const myBets = useMemo(() => {
    return bets.filter((bet) => bet.playerId === playerId);
  }, [bets, playerId]);

  // Calculate total potential winnings
  const totalPotentialWinnings = useMemo(() => {
    return myBets.reduce((sum, bet) => {
      return sum + calculateWinnings(bet);
    }, 0);
  }, [myBets, calculateWinnings]);

  return (
    <>
      {/* Small Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          background: isOpen ? "#00ff00" : "rgba(0, 255, 0, 0.7)",
          color: "#000",
          border: "2px solid #00ff00",
          borderRadius: "8px",
          padding: "10px 20px",
          fontSize: "14px",
          fontWeight: "bold",
          cursor: "pointer",
          zIndex: 1001,
          fontFamily: "monospace",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.target.style.background = "#00ff00";
          e.target.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = isOpen ? "#00ff00" : "rgba(0, 255, 0, 0.7)";
          e.target.style.transform = "scale(1)";
        }}
      >
        {isOpen ? "✕ Close" : "💰 Betting"}
      </button>

      {/* Betting Panel */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "20px",
            background: "rgba(0, 0, 0, 0.95)",
            color: "#fff",
            padding: "20px",
            borderRadius: "12px",
            minWidth: "400px",
            maxWidth: "500px",
            maxHeight: "70vh",
            overflowY: "auto",
            zIndex: 1000,
            border: "2px solid #00ff00",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            fontFamily: "monospace",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
              paddingBottom: "15px",
              borderBottom: "2px solid #00ff00",
            }}
          >
            <h2 style={{ margin: 0, color: "#00ff00", fontSize: "20px" }}>
              💰 Live Betting
            </h2>
            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
              <button
                onClick={() => setShowBettingHistory(!showBettingHistory)}
                style={{
                  background: showBettingHistory
                    ? "#00ff00"
                    : "rgba(0, 255, 0, 0.2)",
                  color: showBettingHistory ? "#000" : "#00ff00",
                  border: "1px solid #00ff00",
                  borderRadius: "6px",
                  padding: "6px 12px",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                My Bets
              </button>
            </div>
          </div>

          {/* Pool Info */}
          <div
            style={{
              background: "rgba(0, 255, 0, 0.1)",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "20px",
              border: "1px solid #00ff00",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: "#888", fontSize: "12px" }}>
                Total Pool
              </span>
              <span
                style={{
                  color: "#00ff00",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
              >
                {totalPool.toLocaleString()} pts
              </span>
            </div>
            {myBets.length > 0 && (
              <div
                style={{
                  marginTop: "8px",
                  paddingTop: "8px",
                  borderTop: "1px solid rgba(0, 255, 0, 0.3)",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "#888", fontSize: "12px" }}>
                  Your Potential Winnings
                </span>
                <span
                  style={{
                    color: "#ffaa00",
                    fontSize: "16px",
                    fontWeight: "bold",
                  }}
                >
                  {totalPotentialWinnings.toFixed(0)} pts
                </span>
              </div>
            )}
          </div>

          {/* Betting History View */}
          {showBettingHistory ? (
            <div>
              <h3
                style={{
                  color: "#00ff00",
                  fontSize: "16px",
                  marginBottom: "15px",
                }}
              >
                Your Bets
              </h3>
              {myBets.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#888",
                  }}
                >
                  No bets placed yet
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {myBets.map((bet) => {
                    const stats = getPlayerStats(bet.targetPlayerId);
                    const winnings = calculateWinnings(bet);
                    const targetOdds = odds[bet.targetPlayerId] || {
                      percentage: "50.0",
                    };

                    return (
                      <div
                        key={bet.id}
                        style={{
                          background: "rgba(0, 255, 0, 0.05)",
                          padding: "12px",
                          borderRadius: "8px",
                          border: "1px solid rgba(0, 255, 0, 0.3)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginBottom: "8px",
                          }}
                        >
                          <span style={{ color: "#00ff00", fontWeight: "bold" }}>
                            Player {bet.targetPlayerId.slice(-6)}
                          </span>
                          <span style={{ color: "#fff" }}>
                            {bet.amount} pts
                          </span>
                        </div>
                        {stats && (
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#888",
                              marginBottom: "6px",
                            }}
                          >
                            Laps: {stats.laps} | Score: {stats.score} | Speed:{" "}
                            {Math.round(stats.speed * 10)} km/h
                          </div>
                        )}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                          }}
                        >
                          <span style={{ color: "#888" }}>Odds: {targetOdds.percentage}%</span>
                          <span style={{ color: "#ffaa00", fontWeight: "bold" }}>
                            Potential: {winnings.toFixed(0)} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Betting Market View */
            <div>
              <h3
                style={{
                  color: "#00ff00",
                  fontSize: "16px",
                  marginBottom: "15px",
                }}
              >
                Bet on Players
              </h3>
              {availablePlayers.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: "#888",
                  }}
                >
                  No other players available to bet on
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {availablePlayers.map((targetPlayerId) => {
                    const stats = getPlayerStats(targetPlayerId);
                    const playerOdds = odds[targetPlayerId] || {
                      percentage: "50.0",
                      multiplier: "2.00",
                    };
                    const isSelected = selectedPlayer === targetPlayerId;

                    return (
                      <div
                        key={targetPlayerId}
                        style={{
                          background: isSelected
                            ? "rgba(0, 255, 0, 0.15)"
                            : "rgba(0, 255, 0, 0.05)",
                          padding: "15px",
                          borderRadius: "8px",
                          border: isSelected
                            ? "2px solid #00ff00"
                            : "1px solid rgba(0, 255, 0, 0.3)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onClick={() => setSelectedPlayer(targetPlayerId)}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "10px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                color: "#00ff00",
                                fontWeight: "bold",
                                fontSize: "14px",
                              }}
                            >
                              Player {targetPlayerId.slice(-6)}
                            </div>
                            {stats && (
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "#888",
                                  marginTop: "4px",
                                }}
                              >
                                Laps: {stats.laps} | Score: {stats.score} | Speed:{" "}
                                {Math.round(stats.speed * 10)} km/h
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              textAlign: "right",
                            }}
                          >
                            <div
                              style={{
                                color: "#00ff00",
                                fontSize: "18px",
                                fontWeight: "bold",
                              }}
                            >
                              {playerOdds.percentage}%
                            </div>
                            <div
                              style={{
                                color: "#888",
                                fontSize: "11px",
                              }}
                            >
                              {playerOdds.multiplier}x payout
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div
                            style={{
                              marginTop: "15px",
                              paddingTop: "15px",
                              borderTop: "1px solid rgba(0, 255, 0, 0.3)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                alignItems: "center",
                                marginBottom: "10px",
                              }}
                            >
                              <input
                                type="number"
                                min="1"
                                step="1"
                                value={betAmount}
                                onChange={(e) =>
                                  setBetAmount(parseInt(e.target.value) || 0)
                                }
                                style={{
                                  flex: 1,
                                  background: "rgba(0, 0, 0, 0.5)",
                                  border: "1px solid #00ff00",
                                  borderRadius: "6px",
                                  padding: "8px",
                                  color: "#fff",
                                  fontSize: "14px",
                                }}
                                placeholder="Bet amount"
                              />
                              <span style={{ color: "#888", fontSize: "12px" }}>
                                pts
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "10px",
                                fontSize: "12px",
                              }}
                            >
                              <span style={{ color: "#888" }}>Potential Win:</span>
                              <span
                                style={{
                                  color: "#ffaa00",
                                  fontWeight: "bold",
                                }}
                              >
                                {(
                                  betAmount * parseFloat(playerOdds.multiplier)
                                ).toFixed(0)}{" "}
                                pts
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlaceBet();
                              }}
                              style={{
                                width: "100%",
                                background: "#00ff00",
                                color: "#000",
                                border: "none",
                                borderRadius: "6px",
                                padding: "10px",
                                fontSize: "14px",
                                fontWeight: "bold",
                                cursor: "pointer",
                                fontFamily: "monospace",
                              }}
                            >
                              Place Bet ({betAmount} pts)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}

