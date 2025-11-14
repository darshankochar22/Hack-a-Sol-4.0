import { useState } from "react";
import { carConfigs } from "../config/carConfigs";
import "./CarSelection.css";

export function CarSelection({ onSelectCar, onStartRace }) {
  const [selectedCar, setSelectedCar] = useState("ferrari");

  const handleSelect = (carType) => {
    setSelectedCar(carType);
  };

  const handleConfirm = () => {
    onSelectCar(selectedCar);
    // If onStartRace is provided, trigger it immediately
    if (onStartRace) {
      setTimeout(() => {
        onStartRace({ carType: selectedCar, raceDuration: 60 });
      }, 100);
    }
  };

  return (
    <div className="car-selection-overlay">
      <div className="car-selection-container">
        <h2 className="selection-title">🏎️ Select Your F1 Car</h2>
        
        <div className="cars-grid">
          {Object.entries(carConfigs).map(([key, config]) => (
            <div
              key={key}
              className={`car-card ${selectedCar === key ? "selected" : ""}`}
              onClick={() => handleSelect(key)}
            >
              <div
                className="car-preview"
                style={{ backgroundColor: config.bodyColor }}
              >
                <div className="car-body-preview">
                  <div
                    className="car-body-box"
                    style={{ backgroundColor: config.bodyColor }}
                  ></div>
                  <div
                    className="car-accent"
                    style={{ backgroundColor: config.accentColor }}
                  ></div>
                  <div className="car-wheels">
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="car-wheel-preview"
                        style={{ borderColor: config.accentColor }}
                      >
                        <div
                          className="wheel-center"
                          style={{ backgroundColor: config.bodyColor }}
                        ></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="car-info">
                <h3 className="car-name">{config.name}</h3>
                <div className="car-stats">
                  <div className="stat-item">
                    <span className="stat-label">Speed</span>
                    <div className="stat-bar">
                      <div
                        className="stat-fill"
                        style={{
                          width: `${config.stats.speed}%`,
                          backgroundColor: config.primaryColor,
                        }}
                      ></div>
                    </div>
                    <span className="stat-value">{config.stats.speed}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Handling</span>
                    <div className="stat-bar">
                      <div
                        className="stat-fill"
                        style={{
                          width: `${config.stats.handling}%`,
                          backgroundColor: config.primaryColor,
                        }}
                      ></div>
                    </div>
                    <span className="stat-value">{config.stats.handling}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Acceleration</span>
                    <div className="stat-bar">
                      <div
                        className="stat-fill"
                        style={{
                          width: `${config.stats.acceleration}%`,
                          backgroundColor: config.primaryColor,
                        }}
                      ></div>
                    </div>
                    <span className="stat-value">{config.stats.acceleration}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "32px", textAlign: "center" }}>
          <button 
            className="confirm-button" 
            onClick={handleConfirm}
            style={{
              background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
              fontSize: "20px",
              padding: "20px 48px",
              fontWeight: "700",
              width: "100%",
              maxWidth: "500px",
              margin: "0 auto",
              display: "block",
              boxShadow: "0 8px 24px rgba(34, 197, 94, 0.5)",
            }}
          >
            🏁 START AUTOMATED RACE
          </button>
          <p style={{ 
            marginTop: "20px", 
            color: "#94a3b8", 
            fontSize: "16px",
            textAlign: "center",
            fontWeight: "500"
          }}>
            ⏱️ 60 seconds • 🤖 All cars race automatically • 📊 View Analytics for stats
          </p>
        </div>
      </div>
    </div>
  );
}

