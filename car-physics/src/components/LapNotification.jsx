import { useEffect, useState } from "react";

export function LapNotification({ show, lapNumber, lapTime, points, formatTime }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 2000,
        pointerEvents: "none",
        animation: "fadeInOut 3s ease-in-out",
      }}
    >
      <div
        style={{
          background: "linear-gradient(135deg, #00ff00, #00cc00)",
          padding: "30px 50px",
          borderRadius: "20px",
          border: "4px solid #ffffff",
          boxShadow: "0 10px 40px rgba(0, 255, 0, 0.5)",
          textAlign: "center",
          color: "#000",
          fontFamily: "monospace",
          fontWeight: "bold",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "10px" }}>🏁</div>
        <div style={{ fontSize: "32px", marginBottom: "5px" }}>
          LAP {lapNumber} COMPLETE!
        </div>
        {lapTime && (
          <div style={{ fontSize: "24px", marginBottom: "10px", color: "#333" }}>
            {formatTime(lapTime)}
          </div>
        )}
        <div
          style={{
            fontSize: "28px",
            color: "#0066cc",
            marginTop: "10px",
            borderTop: "2px solid #000",
            paddingTop: "10px",
          }}
        >
          +{points} POINTS
        </div>
      </div>
      <style>
        {`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
            10% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            90% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          }
        `}
      </style>
    </div>
  );
}

