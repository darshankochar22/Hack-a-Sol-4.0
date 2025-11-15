import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/cannon";
import { F1RacingScene } from "../components/F1RacingScene";
import { CarSelection } from "../components/CarSelection";
import { BettingMarket } from "../components/BettingMarket";
import { RaceSetup } from "../components/RaceSetup";
import { LiveStandings } from "../components/LiveStandings";
import { useState, useCallback, useMemo, useEffect } from "react";
import {
  getRacerNFTContract,
  getTotalSupply,
  getRacerStats,
  getRaceData,
} from "../utils/contracts";
import { carConfigs } from "../config/carConfigs";
import { useRace } from "../contexts/RaceContext";

export function RacingPage({ provider, signer, account, isConnected, racers, setRacers }) {
  const {
    isRaceActive,
    selectedCar,
    raceTime,
    speed,
    activeRaceId,
    currentTokenId,
    competitors,
    raceDuration,
    startRace,
    endRace,
    updateRaceProgress,
    updateCompetitor,
    handleLapComplete,
    setSelectedCar,
  } = useRace();

  const [raceData, setRaceData] = useState({});
  const [showRaceSetup, setShowRaceSetup] = useState(false);

  // Lap completion handler - forwards to race context
  const onLapComplete = useCallback((data) => {
    // Forward lap completion to race context
    if (handleLapComplete) {
      handleLapComplete(data);
    }
    console.log("Lap completed:", data);
  }, [handleLapComplete]);

  const handleStartRace = useCallback(
    (config) => {
      const raceId = activeRaceId || 1;
      const tokenId = currentTokenId || 1;
      
      // Create 3-5 bot competitors
      const botCompetitors = Array.from({ length: 4 }, (_, i) => ({
        tokenId: 10001 + i,
        name: `Bot ${i + 1}`,
        aggressiveness: 40 + i * 10, // 40, 50, 60, 70
        consistency: 50 + i * 5, // 50, 55, 60, 65
        carType: ["mercedes", "ferrari", "redbull", "mclaren"][i] || "mercedes",
      }));
      
      startRace(raceId, tokenId, config.carType, botCompetitors);
      setShowRaceSetup(false);
      console.log("Race started with config:", config);
    },
    [startRace, activeRaceId, currentTokenId]
  );

  const handleCancelRaceSetup = useCallback(() => {
    setShowRaceSetup(false);
  }, []);

  const getPositionSuffix = (position) => {
    if (position === 1) return "st";
    if (position === 2) return "nd";
    if (position === 3) return "rd";
    return "th";
  };

  // Fetch racers from contract
  useEffect(() => {
    if (!isConnected || !provider) return;

    const fetchRacers = async () => {
      try {
        const contract = getRacerNFTContract(provider);
        const supply = await getTotalSupply(contract);
        const racerPromises = [];

        for (let i = 0; i < supply; i++) {
          racerPromises.push(getRacerStats(contract, i));
        }

        const racerData = await Promise.all(racerPromises);
        const formattedRacers = racerData.map((stats, index) => ({
          tokenId: index,
          ...stats,
          config: carConfigs[stats.carType] || carConfigs.default,
        }));

        setRacers(formattedRacers);
      } catch (error) {
        console.error("Failed to fetch racers:", error);
      }
    };

    fetchRacers();
  }, [isConnected, provider, setRacers]);

  // Fetch race data
  useEffect(() => {
    if (!isConnected || !provider) return;

    const fetchRaceData = async () => {
      try {
        const contract = getRacerNFTContract(provider);
        const data = await getRaceData(contract);
        setRaceData(data);
      } catch (error) {
        console.error("Failed to fetch race data:", error);
      }
    };

    fetchRaceData();
    const interval = setInterval(fetchRaceData, 5000);
    return () => clearInterval(interval);
  }, [isConnected, provider]);

  // Handle position updates - delegate to race context
  const handlePositionUpdate = useCallback(
    (data) => {
      // Update race progress (which handles telemetry)
      updateRaceProgress(data);

      // Update local race data for UI
      if (racers.length > 0 && currentTokenId) {
        const raceDataUpdate = {
          currentSpeed: Math.round((data.speed || 0) * 10),
          currentLap: Math.floor((raceTime || 0) / 10) + 1, // Approximate lap based on time
          position: competitors.find(c => c.isPlayer)?.position || 1,
          lapProgress: Math.min(100, ((raceTime || 0) % 10) * 10),
          isActive: true,
          ...data.metrics,
        };

      setRaceData((prev) => ({
        ...prev,
        [currentTokenId]: raceDataUpdate,
      }));
    }
  },
  [updateRaceProgress, raceTime, competitors, racers, currentTokenId]
);

  const canvasProps = useMemo(
    () => ({
      shadows: true,
      gl: {
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      },
      camera: {
        fov: 60,
        near: 0.1,
        far: 1000,
      },
    }),
    []
  );

  if (showRaceSetup) {
    return (
      <RaceSetup
        onStartRace={handleStartRace}
        onCancel={handleCancelRaceSetup}
      />
    );
  }

  // Show car selection if no car selected and no race active
  if (!selectedCar && !isRaceActive) {
    return (
      <div style={{ paddingTop: "60px", minHeight: "calc(100vh - 60px)" }}>
        <CarSelection 
          onSelectCar={setSelectedCar}
          onStartRace={(config) => {
            setSelectedCar(config.carType);
            handleStartRace(config);
          }}
        />
      </div>
    );
  }

  // Show Start Race button when car is selected but race not active
  if (selectedCar && !isRaceActive) {
    return (
      <div className="racing-page-container">
        <Canvas
          {...canvasProps}
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0,
            background: "#0a0a0a",
          }}
        >
          <Physics broadphase="SAP" gravity={[0, -9.81, 0]}>
            <F1RacingScene
              onLapComplete={onLapComplete}
              onPositionUpdate={handlePositionUpdate}
              carType={selectedCar}
              competitors={[]}
              onCompetitorUpdate={updateCompetitor}
            />
          </Physics>
        </Canvas>

        <div
          style={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(34, 197, 94, 0.5)",
            borderRadius: "16px",
            padding: "32px",
            zIndex: 1000,
            textAlign: "center",
            minWidth: "400px",
          }}
        >
          <h2 style={{ margin: "0 0 16px 0", color: "#f8fafc" }}>🏎️ Ready to Race</h2>
          <p style={{ margin: "0 0 24px 0", color: "#94a3b8" }}>
            Selected Car: <strong style={{ color: "#f8fafc" }}>{selectedCar}</strong>
          </p>
          <button
            onClick={() => {
              // Start race directly without setup modal
              handleStartRace({ carType: selectedCar, raceDuration: 60 });
            }}
            style={{
              padding: "16px 32px",
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontSize: "18px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 12px rgba(34, 197, 94, 0.4)",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "linear-gradient(135deg, #16a34a 0%, #15803d 100%)";
              e.target.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)";
              e.target.style.transform = "scale(1)";
            }}
          >
            🏁 Start Automated Race
          </button>
          <button
            onClick={() => setSelectedCar(null)}
            style={{
              marginTop: "12px",
              padding: "8px 16px",
              background: "transparent",
              color: "#94a3b8",
              border: "1px solid rgba(148, 163, 184, 0.3)",
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
            }}
          >
            Change Car
          </button>
        </div>
      </div>
    );
  }

  // Show race in progress indicator if race is active but user navigated away
  if (isRaceActive && !selectedCar) {
    return (
      <div style={{ 
        paddingTop: "60px", 
        display: "flex", 
        flexDirection: "column", 
        alignItems: "center", 
        justifyContent: "center", 
        height: "calc(100vh - 60px)",
        background: "#0f172a",
        color: "#ffffff"
      }}>
        <h2>🏁 Race in Progress</h2>
        <p>Time: {raceTime} / {raceDuration}s</p>
        <p>Speed: {Math.round(speed * 10)} km/h</p>
        <p>Position: {competitors.find(c => c.isPlayer)?.position || 1}</p>
        <button
          onClick={endRace}
          style={{
            marginTop: "20px",
            padding: "12px 24px",
            background: "#ef4444",
            color: "#ffffff",
            border: "none",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          End Race
        </button>
      </div>
    );
  }

  return (
    <div className="racing-page-container">
      <Canvas
        {...canvasProps}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          background: "#0a0a0a",
        }}
      >
        <Physics broadphase="SAP" gravity={[0, -9.81, 0]}>
          <F1RacingScene
            onLapComplete={onLapComplete}
            onPositionUpdate={handlePositionUpdate}
            carType={selectedCar}
            competitors={competitors}
            onCompetitorUpdate={updateCompetitor}
          />
        </Physics>
      </Canvas>

      <div className="f1-controls">
        <div className="f1-accent"></div>

        {/* Top Left HUD */}
        <div className="f1-hud-top">
          <div className="hud-panel">
            <div className="hud-label">Time</div>
            <div className="lap-info">
              <span className="lap-current">{raceTime}</span>
              <span className="lap-separator">/</span>
              <span className="lap-total">{raceDuration}s</span>
            </div>
          </div>

          <div className="hud-panel">
            <div className="hud-label">Position</div>
            <div className="position-indicator">
              <span className="position-number">
                {competitors.find(c => c.isPlayer)?.position || 1}
              </span>
              <span className="position-label">
                {getPositionSuffix(competitors.find(c => c.isPlayer)?.position || 1)}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Center Speedometer */}
        <div className="f1-speedometer">
          <div className="speedometer-header">
            <span className="speed-label">SPEED</span>
            <div className="speed-indicator">
              <span className="indicator-dot"></span>
              <span className="indicator-text">LIVE</span>
            </div>
          </div>
          <div className="speed-display">
            <div className="speed-value">
              {Math.round(Math.max(0, speed * 10))}
            </div>
            <div className="speed-unit">km/h</div>
          </div>
          <div className="speed-bar-container">
            <div 
              className="speed-bar" 
              style={{ width: `${Math.min(100, (Math.max(0, speed * 10) / 380) * 100)}%` }}
            ></div>
          </div>
          <div className="speed-markers">
            <span>0</span>
            <span>100</span>
            <span>200</span>
            <span>300</span>
            <span>380</span>
          </div>
        </div>

        {/* Bottom Right Info */}
        <div className="controls-info">
          <h3>🏎️ Race Info</h3>
          <p>
            <strong>🤖 Automated Race</strong>
          </p>
          <p>All cars race automatically</p>
          <p>
            <strong>📈 Analytics</strong>
          </p>
          <p>Check Analytics page for detailed stats & graphs</p>
          <p>
            <strong>K</strong> - Toggle Camera
          </p>
        </div>
      </div>

      {/* Live Standings */}
      {isRaceActive && competitors.length > 0 && (
        <LiveStandings
          competitors={competitors}
          raceTime={raceTime}
          raceDuration={raceDuration}
        />
      )}

      {/* Betting Market */}
      <BettingMarket
        raceData={raceData}
        provider={provider}
        signer={signer}
        isConnected={isConnected}
        account={account}
        racers={racers}
        activeRaceId={activeRaceId}
      />
    </div>
  );
}

