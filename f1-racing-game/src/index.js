import "./App.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { RaceProvider } from "./contexts/RaceContext";
import { Navigation } from "./components/Navigation";
import { RacingPage } from "./pages/RacingPage";
import { MarketsPage } from "./pages/MarketsPage";
import { RaceControlPage } from "./pages/RaceControlPage";
import { PerformancePage } from "./pages/PerformancePage";
import { RaceAnalyticsPage } from "./pages/RaceAnalyticsPage";

function App() {
  const [racers, setRacers] = useState([]);
  const {
    account,
    provider,
    signer,
    isConnected,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  return (
    <RaceProvider>
      <BrowserRouter>
        <div className="app-container">
          <Navigation
            account={account}
            isConnected={isConnected}
            connectWallet={connectWallet}
            disconnectWallet={disconnectWallet}
          />
          <Routes>
            <Route
              path="/"
              element={
                <RacingPage
                  provider={provider}
                  signer={signer}
                  account={account}
                  isConnected={isConnected}
                  racers={racers}
                  setRacers={setRacers}
                />
              }
            />
            <Route
              path="/markets"
              element={
                <MarketsPage
                  provider={provider}
                  signer={signer}
                  account={account}
                  isConnected={isConnected}
                />
              }
            />
            <Route path="/race-control" element={<RaceControlPage />} />
            <Route path="/performance" element={<PerformancePage />} />
            <Route path="/analytics" element={<RaceAnalyticsPage />} />
          </Routes>
        </div>
      </BrowserRouter>
    </RaceProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
