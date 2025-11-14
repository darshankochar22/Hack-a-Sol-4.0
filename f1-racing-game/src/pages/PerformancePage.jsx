import { PerformanceDashboard } from "../components/PerformanceDashboard";
import { useState, useEffect } from "react";
import { useWallet } from "../hooks/useWallet";
import {
  getRacerNFTContract,
  getTotalSupply,
  getRacerStats,
  getRaceData,
} from "../utils/contracts";
import { carConfigs } from "../config/carConfigs";

export function PerformancePage() {
  const { provider, isConnected } = useWallet();
  const [racers, setRacers] = useState([]);
  const [raceData, setRaceData] = useState({});
  const [raceMetrics, setRaceMetrics] = useState(null);

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
  }, [isConnected, provider]);

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

  return (
    <div style={{ paddingTop: "60px", minHeight: "100vh", background: "#0f172a" }}>
      <PerformanceDashboard
        racers={racers}
        raceData={raceData}
        raceMetrics={raceMetrics}
        onClose={() => window.history.back()}
      />
    </div>
  );
}

