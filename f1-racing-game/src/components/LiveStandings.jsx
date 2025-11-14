import { useMemo, useState, useCallback } from "react";
import { getTradingEngineContract, placeBet } from "../utils/contracts";
import "./LiveStandings.css";

export function LiveStandings({ 
  competitors = [], 
  raceTime = 0, 
  raceDuration = 60,
  provider = null,
  signer = null,
  account = null,
  isConnected = false,
  activeRaceId = null
}) {
  const [bettingState, setBettingState] = useState({}); // { tokenId: { amount: "", isPlacing: false } }
  
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

  const handleBetAmountChange = useCallback((tokenId, value) => {
    setBettingState((prev) => ({
      ...prev,
      [tokenId]: {
        ...prev[tokenId],
        amount: value,
      },
    }));
  }, []);

  const handlePlaceBet = useCallback(async (tokenId) => {
    if (!isConnected || !signer || !activeRaceId) {
      alert("Please connect your wallet first");
      return;
    }

    const state = bettingState[tokenId];
    const amount = parseFloat(state?.amount || "0");

    if (isNaN(amount) || amount < 0.001) {
      alert("Minimum bet is 0.001 ETH");
      return;
    }

    // Set loading state
    setBettingState((prev) => ({
      ...prev,
      [tokenId]: {
        ...prev[tokenId],
        isPlacing: true,
      },
    }));

    try {
      // Get the contract instance with signer
      const tradingEngine = getTradingEngineContract(signer);
      
      // Place bet on the contract via MetaMask
      console.log(`Placing bet: ${amount} ETH on Car #${tokenId} in Race #${activeRaceId}`);
      
      const tx = await placeBet(
        tradingEngine,
        signer,
        activeRaceId,
        tokenId,
        amount
      );

      console.log("Bet transaction confirmed:", tx.hash);

      // Show success message
      alert(`✅ Bet placed successfully!\n\nAmount: ${amount} ETH\nCar: #${tokenId}\nRace: #${activeRaceId}\nTransaction: ${tx.hash}`);

      // Clear bet amount after success
      setBettingState((prev) => ({
        ...prev,
        [tokenId]: {
          amount: "",
          isPlacing: false,
        },
      }));
    } catch (error) {
      console.error("Error placing bet:", error);
      
      let errorMessage = "Failed to place bet";
      if (error.message) {
        if (error.message.includes("user rejected")) {
          errorMessage = "Transaction was rejected";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for this bet";
        } else {
          errorMessage = error.message;
        }
      }
      
      alert(`❌ ${errorMessage}`);
      
      // Reset loading state
      setBettingState((prev) => ({
        ...prev,
        [tokenId]: {
          ...prev[tokenId],
          isPlacing: false,
        },
      }));
    }
  }, [isConnected, signer, activeRaceId, bettingState]);

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
          <div className="col-bet">Bet</div>
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
              <div className="col-bet">
                {isConnected && activeRaceId ? (
                  <div className="betting-controls">
                    <input
                      type="number"
                      min="0.001"
                      step="0.001"
                      placeholder="ETH"
                      value={bettingState[competitor.tokenId]?.amount || ""}
                      onChange={(e) => handleBetAmountChange(competitor.tokenId, e.target.value)}
                      className="bet-amount-input"
                      disabled={bettingState[competitor.tokenId]?.isPlacing || false}
                    />
                    <button
                      onClick={() => handlePlaceBet(competitor.tokenId)}
                      disabled={
                        !bettingState[competitor.tokenId]?.amount ||
                        parseFloat(bettingState[competitor.tokenId]?.amount || "0") < 0.001 ||
                        bettingState[competitor.tokenId]?.isPlacing ||
                        false
                      }
                      className="bet-button"
                    >
                      {bettingState[competitor.tokenId]?.isPlacing ? "..." : "Bet"}
                    </button>
                  </div>
                ) : (
                  <span className="points-pending">Connect wallet</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

