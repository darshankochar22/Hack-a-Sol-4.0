import { useState } from "react";
import "./RaceSetup.css";

export function RaceSetup({ onStartRace, onCancel }) {
  const [selectedCar] = useState("ferrari");

  const handleStart = () => {
    onStartRace({
      carType: selectedCar,
      raceDuration: 60, // 60 seconds
    });
  };

  return (
    <div className="race-setup-overlay">
      <div className="race-setup-container">
        <h2>🏁 Race Setup</h2>
        
        <div className="setup-section">
          <label>Race Duration</label>
          <div className="race-info">
            <div className="race-duration-badge">
              <span className="duration-value">60</span>
              <span className="duration-unit">seconds</span>
            </div>
            <p className="race-description">
              Fully automated race! All cars (including yours) will race automatically. 
              Watch the race unfold and check the Analytics page for detailed statistics and graphs!
            </p>
            <div className="points-info">
              <strong>Points System:</strong>
              <ul>
                <li>1st: 25 points</li>
                <li>2nd: 18 points</li>
                <li>3rd: 15 points</li>
                <li>4th: 12 points</li>
                <li>5th: 10 points</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="setup-actions">
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
          <button className="start-btn" onClick={handleStart}>
            Start Race
          </button>
        </div>
      </div>
    </div>
  );
}

