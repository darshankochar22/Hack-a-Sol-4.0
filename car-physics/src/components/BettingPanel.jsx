import { useState, useMemo } from "react";
import { ethers } from "ethers";
import { PerformanceDashboard } from "./PerformanceDashboard";
import { useWallet } from "../hooks/useWallet";

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
  const [betAmount, setBetAmount] = useState(0.001); // ETH amount
  const [activeView, setActiveView] = useState("betting"); // "betting" or "performance"
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  // Wallet integration
  const {
    account,
    signer,
    isConnected: isWalletConnected,
    isConnecting,
    balance,
    connectWallet,
    disconnectWallet,
    isMetaMaskInstalled,
  } = useWallet();

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

  // Get available players (reactive to players changes)
  const availablePlayers = useMemo(() => {
    const available = getAvailablePlayers();
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log("Available players for betting:", available);
      console.log("Total players in room:", Object.keys(players || {}).length + 1);
    }
    return available;
  }, [getAvailablePlayers, players]);

  // Handle bet placement with MetaMask
  const handlePlaceBet = async () => {
    if (!selectedPlayer) {
      alert("Please select a player to bet on");
      return;
    }

    if (!isWalletConnected || !signer) {
      alert("Please connect your MetaMask wallet first!");
      return;
    }

    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Bet amount must be greater than 0");
      return;
    }

    if (amount < 0.001) {
      alert("Minimum bet is 0.001 ETH");
      return;
    }

    if (balance !== null && amount > balance) {
      alert("Insufficient balance. Please ensure you have enough ETH in your wallet.");
      return;
    }

    setIsPlacingBet(true);
    try {
      // For now, we'll use a simple ETH transfer approach
      // In production, you'd call a smart contract here
      const tx = await signer.sendTransaction({
        to: "0x0000000000000000000000000000000000000000", // Placeholder - replace with contract address
        value: ethers.parseEther(amount.toString()),
      });

      // Wait for transaction confirmation
      await tx.wait();

      // Also record the bet locally
      const success = placeBet(selectedPlayer, amount);
      if (success) {
        alert(
          `✅ Bet placed successfully!\n\nAmount: ${amount} ETH\nPlayer: ${selectedPlayer.slice(-6)}\nTransaction: ${tx.hash}`
        );
        setSelectedPlayer(null);
        setBetAmount(0.001);
      }
    } catch (error) {
      console.error("Error placing bet:", error);
      if (error.message && error.message.includes("user rejected")) {
        alert("❌ Transaction cancelled by user");
      } else if (error.message && error.message.includes("insufficient funds")) {
        alert("❌ Insufficient funds. Please ensure you have enough ETH in your wallet.");
      } else {
        alert("❌ Failed to place bet: " + (error.message || error.toString()));
      }
    } finally {
      setIsPlacingBet(false);
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
          position: "fixed",
          bottom: "20px",
          left: "20px",
          background: isOpen ? "#00ff00" : "rgba(0, 255, 0, 0.9)",
          color: "#000",
          border: "3px solid #00ff00",
          borderRadius: "10px",
          padding: "12px 24px",
          fontSize: "16px",
          fontWeight: "bold",
          cursor: "pointer",
          zIndex: 10000,
          fontFamily: "monospace",
          boxShadow: "0 4px 12px rgba(0, 255, 0, 0.5)",
          transition: "all 0.3s ease",
          pointerEvents: "auto",
        }}
        onMouseEnter={(e) => {
          e.target.style.background = "#00ff00";
          e.target.style.transform = "scale(1.1)";
          e.target.style.boxShadow = "0 6px 16px rgba(0, 255, 0, 0.7)";
        }}
        onMouseLeave={(e) => {
          e.target.style.background = isOpen ? "#00ff00" : "rgba(0, 255, 0, 0.9)";
          e.target.style.transform = "scale(1)";
          e.target.style.boxShadow = "0 4px 12px rgba(0, 255, 0, 0.5)";
        }}
      >
        {isOpen ? "✕ Close Betting" : "💰 Betting"}
      </button>

      {/* Betting Panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
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
            zIndex: 9999,
            border: "2px solid #00ff00",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
            fontFamily: "monospace",
            pointerEvents: "auto",
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
              💰 Live Betting & Performance
            </h2>
            {/* Wallet Connection */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              {isWalletConnected ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      fontSize: "11px",
                    }}
                  >
                    <div style={{ color: "#00ff00" }}>
                      {account
                        ? `${account.slice(0, 6)}...${account.slice(-4)}`
                        : "Connected"}
                    </div>
                    {balance !== null && (
                      <div style={{ color: "#888", fontSize: "10px" }}>
                        {balance.toFixed(4)} ETH
                      </div>
                    )}
                  </div>
                  <button
                    onClick={disconnectWallet}
                    style={{
                      background: "rgba(255, 0, 0, 0.2)",
                      color: "#ff0000",
                      border: "1px solid #ff0000",
                      borderRadius: "6px",
                      padding: "6px 12px",
                      fontSize: "11px",
                      cursor: "pointer",
                    }}
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={connectWallet}
                  disabled={isConnecting || !isMetaMaskInstalled}
                  style={{
                    background: isMetaMaskInstalled
                      ? "rgba(0, 255, 0, 0.2)"
                      : "rgba(128, 128, 128, 0.2)",
                    color: isMetaMaskInstalled ? "#00ff00" : "#888",
                    border: `1px solid ${isMetaMaskInstalled ? "#00ff00" : "#888"}`,
                    borderRadius: "6px",
                    padding: "6px 12px",
                    fontSize: "11px",
                    cursor: isMetaMaskInstalled ? "pointer" : "not-allowed",
                    opacity: isConnecting ? 0.6 : 1,
                  }}
                >
                  {isConnecting
                    ? "Connecting..."
                    : isMetaMaskInstalled
                    ? "Connect Wallet"
                    : "Install MetaMask"}
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              marginBottom: "20px",
              borderBottom: "1px solid rgba(0, 255, 0, 0.3)",
            }}
          >
            <button
              onClick={() => setActiveView("performance")}
              style={{
                flex: 1,
                background:
                  activeView === "performance"
                    ? "rgba(0, 255, 0, 0.2)"
                    : "transparent",
                color: activeView === "performance" ? "#00ff00" : "#888",
                border: "none",
                borderBottom:
                  activeView === "performance"
                    ? "2px solid #00ff00"
                    : "2px solid transparent",
                borderRadius: "0",
                padding: "10px",
                fontSize: "14px",
                fontWeight: activeView === "performance" ? "bold" : "normal",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              📊 Performance
            </button>
            <button
              onClick={() => setActiveView("betting")}
              style={{
                flex: 1,
                background:
                  activeView === "betting"
                    ? "rgba(0, 255, 0, 0.2)"
                    : "transparent",
                color: activeView === "betting" ? "#00ff00" : "#888",
                border: "none",
                borderBottom:
                  activeView === "betting"
                    ? "2px solid #00ff00"
                    : "2px solid transparent",
                borderRadius: "0",
                padding: "10px",
                fontSize: "14px",
                fontWeight: activeView === "betting" ? "bold" : "normal",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              💰 Betting
            </button>
          </div>

          {/* Performance Dashboard View */}
          {activeView === "performance" ? (
            <PerformanceDashboard
              players={players}
              playerId={playerId}
              myScore={myScore}
              myLaps={myLaps}
              mySpeed={mySpeed}
              myPosition={myPosition}
            />
          ) : (
            /* Betting View */
            <>
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
                    {totalPool.toFixed(4)} ETH
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
                      {totalPotentialWinnings.toFixed(4)} ETH
                    </span>
                  </div>
                )}
              </div>

              {/* Betting Market View */}
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
                  <div style={{ marginBottom: "10px", fontSize: "14px" }}>
                    No other players available to bet on
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
                    Connected players: {Object.keys(players || {}).length + 1}
                    <br />
                    (You + {Object.keys(players || {}).length} others)
                  </div>
                  {Object.keys(players || {}).length > 0 && (
                    <div style={{ fontSize: "11px", color: "#555", marginTop: "10px" }}>
                      Waiting for player data to sync...
                      <br />
                      Player IDs: {Object.keys(players || {}).map(id => id.slice(-6)).join(", ")}
                    </div>
                  )}
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
                                ETH
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
                                ).toFixed(4)}{" "}
                                ETH
                              </span>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlaceBet();
                              }}
                              disabled={!isWalletConnected || isPlacingBet}
                              style={{
                                width: "100%",
                                background:
                                  isWalletConnected && !isPlacingBet
                                    ? "#00ff00"
                                    : "rgba(128, 128, 128, 0.5)",
                                color: isWalletConnected && !isPlacingBet ? "#000" : "#888",
                                border: "none",
                                borderRadius: "6px",
                                padding: "10px",
                                fontSize: "14px",
                                fontWeight: "bold",
                                cursor:
                                  isWalletConnected && !isPlacingBet
                                    ? "pointer"
                                    : "not-allowed",
                                fontFamily: "monospace",
                                opacity: isPlacingBet ? 0.6 : 1,
                              }}
                            >
                              {isPlacingBet
                                ? "Processing..."
                                : !isWalletConnected
                                ? "Connect Wallet to Bet"
                                : `Place Bet (${betAmount} ETH)`}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

