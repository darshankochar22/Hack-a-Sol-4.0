import { Link, useLocation } from "react-router-dom";
import "./Navigation.css";

export function Navigation({ account, isConnected, connectWallet, disconnectWallet }) {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <nav className="main-navigation">
      <div className="nav-brand">
        <Link to="/">THE GRID EXPERIENCE</Link>
      </div>
      <div className="nav-links">
        <Link to="/" className={`nav-link ${isActive("/")}`}>
          🏁 Race
        </Link>
        <Link to="/markets" className={`nav-link ${isActive("/markets")}`}>
          📈 Markets
        </Link>
        <Link to="/race-control" className={`nav-link ${isActive("/race-control")}`}>
          📡 Race Control
        </Link>
        <Link to="/performance" className={`nav-link ${isActive("/performance")}`}>
          📊 Performance
        </Link>
        <Link to="/analytics" className={`nav-link ${isActive("/analytics")}`}>
          📈 Analytics
        </Link>
      </div>
      <div className="nav-wallet">
        {isConnected ? (
          <div className="wallet-connected">
            <span className="wallet-address">
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </span>
            <button className="disconnect-btn" onClick={disconnectWallet}>
              Disconnect
            </button>
          </div>
        ) : (
          <button className="connect-btn" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>
    </nav>
  );
}

