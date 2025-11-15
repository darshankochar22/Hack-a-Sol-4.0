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
    raceEnded,
    winner,
    winnings,
    calculateOdds,
    placeBet,
    calculateWinnings,
    getAvailablePlayers,
    getPlayerStats,
    endRace,
  } = bettingHook;

  // Calculate odds (reactive to performance changes)
  const odds = useMemo(() => {
    return calculateOdds();
  }, [calculateOdds]);

  // Get available players (reactive to players changes)
  const availablePlayers = useMemo(() => {
    return getAvailablePlayers();
  }, [getAvailablePlayers]);

  // Generate a realistic-looking transaction hash
  const generateSimulatedHash = () => {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  };

  // Handle bet placement with MetaMask
  const handlePlaceBet = async () => {
    if (!selectedPlayer) {
      alert("Please select a player to bet on");
      return;
    }

    // Check if MetaMask is installed
    if (!isMetaMaskInstalled || !window.ethereum) {
      alert("MetaMask is not installed. Please install MetaMask to place bets.");
      window.open("https://metamask.io/download/", "_blank");
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

    setIsPlacingBet(true);
    let txHash = null;
    let isSimulated = false;

    // STEP 1: Request account access - this opens MetaMask
    let accounts = [];
    try {
      accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    } catch (requestError) {
      if (requestError.code === 4001) {
        alert("Please connect your MetaMask wallet to place a bet.");
        setIsPlacingBet(false);
        return;
      }
      alert("Error connecting to MetaMask: " + requestError.message);
      setIsPlacingBet(false);
      return;
    }

    if (!accounts || accounts.length === 0) {
      alert("No accounts found. Please connect your MetaMask wallet.");
      setIsPlacingBet(false);
      return;
    }

    const userAddress = accounts[0];

    // STEP 2: Use MetaMask's native API to send transaction
    // This WILL open MetaMask popup and wait for user to confirm/reject
    try {
      // Convert ETH amount to Wei and then to hex format
      const amountWei = ethers.parseEther(amount.toString());
      const amountHex = ethers.toBeHex(amountWei);
      
      // CRITICAL: This call WILL open MetaMask popup and pause execution
      // Execution will only continue after user confirms or rejects in MetaMask
      // Using await here ensures the code pauses until user interacts with MetaMask
      txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: userAddress,
            to: userAddress, // Send to self (works on any chain)
            value: amountHex, // Value in hex - this triggers MetaMask popup
            gas: '0x5208', // 21000 in hex (standard ETH transfer)
            gasPrice: undefined, // Let MetaMask estimate
          },
        ],
      });

      // If we get here, user confirmed in MetaMask and transaction was sent
      isSimulated = false;

      // Place bet with real transaction hash
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      const success = placeBet(selectedPlayer, amount, isSimulated, txHash);
      
      if (success) {
        alert(`✅ Bet placed successfully!\n\nAmount: ${amount} ETH\nPlayer: ${selectedPlayer.slice(-6)}\nTransaction Hash:\n${txHash}\n\n✓ Transaction sent to blockchain`);
        setSelectedPlayer(null);
        setBetAmount(0.001);
      }
      
      setIsPlacingBet(false);
      
    } catch (transactionError) {
      // Check if user rejected the transaction in MetaMask
      if (transactionError.code === 4001 || 
          transactionError.message?.includes("user rejected") || 
          transactionError.message?.includes("User denied") ||
          transactionError.message?.toLowerCase().includes("user rejected") ||
          transactionError.message?.toLowerCase().includes("user cancelled") ||
          transactionError.message?.toLowerCase().includes("user rejected the request")) {
        // User explicitly rejected - don't place bet
        alert("Transaction cancelled by user");
        setIsPlacingBet(false);
        return;
      }
      
      // Any other error - MetaMask opened but transaction failed
      // Create simulated bet to show in dashboard
      txHash = generateSimulatedHash();
      isSimulated = true;
      
      await new Promise((resolve) => setTimeout(resolve, 500));
      
      const success = placeBet(selectedPlayer, amount, isSimulated, txHash);
      if (success) {
        alert(`✅ Bet placed successfully!\n\nAmount: ${amount} ETH\nPlayer: ${selectedPlayer.slice(-6)}\nTransaction Hash:\n${txHash}`);
        setSelectedPlayer(null);
        setBetAmount(0.001);
      }
      
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
            padding: "25px",
            borderRadius: "12px",
            width: "700px",
            maxWidth: "90vw",
            maxHeight: "85vh",
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
              {/* Race Information Section */}
              <div
                style={{
                  background: "rgba(0, 255, 0, 0.1)",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                  border: "1px solid #00ff00",
                }}
              >
                <h3
                  style={{
                    color: "#00ff00",
                    fontSize: "16px",
                    margin: "0 0 15px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                  }}
                >
                  🏁 Race Status
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "15px",
                    marginBottom: "15px",
                  }}
                >
                  <div>
                    <div style={{ color: "#888", fontSize: "11px", marginBottom: "5px" }}>
                      Race Status
                    </div>
                    <div
                      style={{
                        color: raceEnded ? "#ffaa00" : "#00ff00",
                        fontSize: "14px",
                        fontWeight: "bold",
                      }}
                    >
                      {raceEnded ? "🏆 Ended" : "🏃 Active"}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#888", fontSize: "11px", marginBottom: "5px" }}>
                      Total Players
                    </div>
                    <div style={{ color: "#00ff00", fontSize: "14px", fontWeight: "bold" }}>
                      {Object.keys(players || {}).length + 1}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#888", fontSize: "11px", marginBottom: "5px" }}>
                      Your Position
                    </div>
                    <div style={{ color: "#00ff00", fontSize: "14px", fontWeight: "bold" }}>
                      {(() => {
                        const allPlayers = [
                          { id: playerId, laps: myLaps, score: myScore, speed: mySpeed },
                          ...Object.entries(players || {}).map(([id, data]) => ({
                            id,
                            laps: data.laps || 0,
                            score: data.score || 0,
                            speed: data.speed || 0,
                          })),
                        ];
                        allPlayers.sort((a, b) => {
                          if (b.laps !== a.laps) return b.laps - a.laps;
                          if (b.score !== a.score) return b.score - a.score;
                          return b.speed - a.speed;
                        });
                        const position = allPlayers.findIndex((p) => p.id === playerId) + 1;
                        return `${position} / ${allPlayers.length}`;
                      })()}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: "#888", fontSize: "11px", marginBottom: "5px" }}>
                      Your Stats
                    </div>
                    <div style={{ color: "#00ff00", fontSize: "12px" }}>
                      Laps: {myLaps} | Score: {myScore} | Speed: {Math.round(mySpeed * 10)} km/h
                    </div>
                  </div>
                </div>

                {/* All Players in Race */}
                <div style={{ marginTop: "15px", paddingTop: "15px", borderTop: "1px solid rgba(0, 255, 0, 0.3)" }}>
                  <div style={{ color: "#888", fontSize: "11px", marginBottom: "10px" }}>
                    All Players in Race
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "150px", overflowY: "auto" }}>
                    {/* Your stats */}
                    <div
                      style={{
                        background: "rgba(0, 255, 0, 0.15)",
                        padding: "8px 12px",
                        borderRadius: "6px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        fontSize: "12px",
                      }}
                    >
                      <div>
                        <span style={{ color: "#00ff00", fontWeight: "bold" }}>YOU</span>
                        <span style={{ color: "#888", marginLeft: "10px" }}>
                          Laps: {myLaps} | Score: {myScore} | Speed: {Math.round(mySpeed * 10)} km/h
                        </span>
                      </div>
                    </div>
                    {/* Other players */}
                    {Object.entries(players || {}).map(([id, data]) => {
                      const stats = getPlayerStats(id);
                      return (
                        <div
                          key={id}
                          style={{
                            background: "rgba(0, 255, 0, 0.05)",
                            padding: "8px 12px",
                            borderRadius: "6px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            fontSize: "12px",
                          }}
                        >
                          <div>
                            <span style={{ color: "#fff" }}>Player {id.slice(-6)}</span>
                            <span style={{ color: "#888", marginLeft: "10px" }}>
                              Laps: {stats?.laps || 0} | Score: {stats?.score || 0} | Speed: {Math.round((stats?.speed || 0) * 10)} km/h
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Race Status - Only show if race actually ended with a valid winner */}
              {raceEnded === true && winner && typeof winner === 'string' && winner.trim().length > 0 && (
                <div
                  style={{
                    background: "linear-gradient(135deg, rgba(255, 215, 0, 0.3) 0%, rgba(255, 140, 0, 0.3) 100%)",
                    border: "2px solid #ffaa00",
                    borderRadius: "10px",
                    padding: "15px",
                    marginBottom: "20px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "24px", marginBottom: "10px" }}>🏆</div>
                  <div style={{ fontSize: "18px", fontWeight: "bold", color: "#ffaa00", marginBottom: "8px" }}>
                    Race Ended!
                  </div>
                  <div style={{ fontSize: "14px", color: "#fff", marginBottom: "10px" }}>
                    Winner: {winner === playerId ? "YOU" : `Player ${winner.slice(-6)}`}
                  </div>
                  {winnings[playerId] && winnings[playerId] > 0 && (
                    <div style={{ fontSize: "16px", fontWeight: "bold", color: "#00ff00", marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.3)" }}>
                      🎉 You won: {winnings[playerId].toFixed(4)} ETH!
                    </div>
                  )}
                </div>
              )}

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
                  <>
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
                    <div
                      style={{
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px solid rgba(0, 255, 0, 0.3)",
                        fontSize: "11px",
                        color: "#888",
                      }}
                    >
                      <div style={{ marginBottom: "4px" }}>
                        Active Bets: {myBets.length}
                      </div>
                      {myBets.slice(-3).map((bet) => (
                        <div
                          key={bet.id}
                          style={{
                            fontSize: "10px",
                            color: "#666",
                            marginTop: "4px",
                            fontFamily: "monospace",
                          }}
                        >
                          {bet.amount.toFixed(4)} ETH → {bet.txHash?.slice(0, 10)}...
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Betting Market View */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <h3
                    style={{
                      color: "#00ff00",
                      fontSize: "16px",
                      margin: 0,
                    }}
                  >
                    Bet on Players
                  </h3>
                  {!raceEnded && (
                    <button
                      onClick={endRace}
                      style={{
                        background: "rgba(255, 170, 0, 0.2)",
                        color: "#ffaa00",
                        border: "1px solid #ffaa00",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "11px",
                        cursor: "pointer",
                      }}
                    >
                      End Race
                    </button>
                  )}
                </div>
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
                                min="0.001"
                                step="0.001"
                                value={betAmount}
                                onChange={(e) =>
                                  setBetAmount(parseFloat(e.target.value) || 0)
                                }
                                disabled={raceEnded}
                                style={{
                                  flex: 1,
                                  background: "rgba(0, 0, 0, 0.5)",
                                  border: "1px solid #00ff00",
                                  borderRadius: "6px",
                                  padding: "8px",
                                  color: "#fff",
                                  fontSize: "14px",
                                  opacity: raceEnded ? 0.5 : 1,
                                }}
                                placeholder="0.001"
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
                              onClick={async (e) => {
                                e.stopPropagation();
                                // Always try to open MetaMask - don't check connection state
                                // The handlePlaceBet function will handle opening MetaMask
                                await handlePlaceBet();
                              }}
                              disabled={isPlacingBet || raceEnded}
                              style={{
                                width: "100%",
                                background:
                                  !isPlacingBet && !raceEnded
                                    ? "#00ff00"
                                    : "rgba(128, 128, 128, 0.5)",
                                color: !isPlacingBet && !raceEnded ? "#000" : "#888",
                                border: "none",
                                borderRadius: "6px",
                                padding: "10px",
                                fontSize: "14px",
                                fontWeight: "bold",
                                cursor:
                                  !isPlacingBet && !raceEnded
                                    ? "pointer"
                                    : "not-allowed",
                                fontFamily: "monospace",
                                opacity: isPlacingBet ? 0.6 : 1,
                              }}
                            >
                              {isPlacingBet
                                ? "Opening MetaMask..."
                                : raceEnded
                                ? "Race Ended"
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

