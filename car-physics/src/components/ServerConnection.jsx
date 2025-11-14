import { useState, useEffect } from "react";

export function ServerConnection({ onServerChange, currentServer, isConnected }) {
  const [showSettings, setShowSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(currentServer || "");
  const [error, setError] = useState("");

  // Load saved server URL from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("multiplayerServerUrl");
    if (saved) {
      setServerUrl(saved);
      if (onServerChange) {
        onServerChange(saved);
      }
    }
  }, [onServerChange]);

  const handleConnect = () => {
    if (!serverUrl.trim()) {
      setError("Please enter a server URL");
      return;
    }

    // Validate URL format
    try {
      const url = new URL(serverUrl);
      if (!url.protocol.startsWith("http")) {
        setError("URL must start with http:// or https://");
        return;
      }
    } catch (e) {
      setError("Invalid URL format. Example: http://192.168.1.100:5003");
      return;
    }

    // Save to localStorage
    localStorage.setItem("multiplayerServerUrl", serverUrl);
    setError("");
    
    // Notify parent to reconnect
    if (onServerChange) {
      onServerChange(serverUrl);
    }
    
    setShowSettings(false);
  };

  const handleQuickConnect = (url) => {
    setServerUrl(url);
    localStorage.setItem("multiplayerServerUrl", url);
    if (onServerChange) {
      onServerChange(url);
    }
    setShowSettings(false);
  };

  return (
    <div
      style={{
        position: "absolute",
        top: "20px",
        left: "20px",
        zIndex: 1001,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {/* Connection Status Button */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        style={{
          padding: "10px 15px",
          background: isConnected ? "rgba(0, 255, 0, 0.2)" : "rgba(255, 0, 0, 0.2)",
          border: `2px solid ${isConnected ? "#00ff00" : "#ff0000"}`,
          borderRadius: "8px",
          color: "#fff",
          cursor: "pointer",
          fontFamily: "monospace",
          fontSize: "14px",
          fontWeight: "bold",
        }}
      >
        {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
        {showSettings ? " ▲" : " ▼"}
      </button>

      {/* Settings Panel */}
      {showSettings && (
        <div
          style={{
            background: "rgba(0, 0, 0, 0.9)",
            padding: "20px",
            borderRadius: "10px",
            border: "2px solid #00ff00",
            minWidth: "350px",
            color: "#fff",
          }}
        >
          <h3 style={{ margin: "0 0 15px 0", color: "#00ff00" }}>
            🌐 Server Connection
          </h3>

          <div style={{ marginBottom: "15px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                color: "#aaa",
              }}
            >
              Server URL (Host's IP Address):
            </label>
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => {
                setServerUrl(e.target.value);
                setError("");
              }}
              placeholder="http://192.168.1.100:5003"
              style={{
                width: "100%",
                padding: "10px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "1px solid #00ff00",
                borderRadius: "5px",
                color: "#fff",
                fontSize: "14px",
                fontFamily: "monospace",
                boxSizing: "border-box",
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleConnect();
                }
              }}
            />
            {error && (
              <div
                style={{
                  marginTop: "8px",
                  color: "#ff6b6b",
                  fontSize: "12px",
                }}
              >
                {error}
              </div>
            )}
          </div>

          <div style={{ marginBottom: "15px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "#888",
                marginBottom: "8px",
              }}
            >
              Quick Connect:
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <button
                onClick={() => handleQuickConnect("http://localhost:5003")}
                style={{
                  padding: "8px 12px",
                  background: "rgba(0, 255, 0, 0.2)",
                  border: "1px solid #00ff00",
                  borderRadius: "5px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Localhost
              </button>
              <button
                onClick={() => {
                  // Try to detect common local network IPs
                  const commonIPs = [
                    "192.168.1.100",
                    "192.168.1.101",
                    "192.168.0.100",
                    "192.168.0.101",
                    "10.0.0.100",
                  ];
                  const ip = prompt(
                    "Enter host's IP address:",
                    commonIPs[0]
                  );
                  if (ip) {
                    handleQuickConnect(`http://${ip}:5003`);
                  }
                }}
                style={{
                  padding: "8px 12px",
                  background: "rgba(0, 255, 0, 0.2)",
                  border: "1px solid #00ff00",
                  borderRadius: "5px",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                Enter IP
              </button>
            </div>
          </div>

          <div
            style={{
              fontSize: "11px",
              color: "#888",
              marginBottom: "15px",
              lineHeight: "1.5",
            }}
          >
            <strong>💡 How to find host's IP:</strong>
            <br />
            Ask the host to check their backend server logs.
            <br />
            Look for: <code style={{ color: "#00ff00" }}>http://192.168.x.x:5003</code>
          </div>

          <button
            onClick={handleConnect}
            style={{
              width: "100%",
              padding: "12px",
              background: "#00ff00",
              border: "none",
              borderRadius: "5px",
              color: "#000",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
            }}
          >
            Connect
          </button>

          {currentServer && (
            <div
              style={{
                marginTop: "10px",
                fontSize: "12px",
                color: "#888",
                textAlign: "center",
              }}
            >
              Current: <code style={{ color: "#00ff00" }}>{currentServer}</code>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

