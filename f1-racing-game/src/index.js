import "./App.css";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { useState } from "react";
import { useWallet } from "./hooks/useWallet";
import { RaceProvider } from "./contexts/RaceContext";
import { Navigation } from "./components/Navigation";
import { RacingPage } from "./pages/RacingPage";

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
          <RacingPage
            provider={provider}
            signer={signer}
            account={account}
            isConnected={isConnected}
            racers={racers}
            setRacers={setRacers}
          />
        </div>
      </BrowserRouter>
    </RaceProvider>
  );
}

createRoot(document.getElementById("root")).render(<App />);
