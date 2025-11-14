// Race monitoring utility to connect with backend
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5002";

export class RaceMonitor {
  constructor(tokenId) {
    this.tokenId = tokenId;
    this.socket = null;
    this.metrics = {
      leftTurns: 0,
      rightTurns: 0,
      speeds: [],
      averageSpeed: 0,
      maxSpeed: 0,
      minSpeed: Infinity,
    };
    this.lastTurnDirection = null;
    this.lastPosition = null;
  }

  // Start race monitoring
  async startRace(totalLaps) {
    try {
      const response = await fetch(`${API_URL}/api/races/start`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: this.tokenId,
          totalLaps,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start race monitoring");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error starting race:", error);
      throw error;
    }
  }

  // End race monitoring
  async endRace() {
    try {
      const response = await fetch(`${API_URL}/api/races/end`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: this.tokenId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to end race");
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error ending race:", error);
      throw error;
    }
  }

  // Update metrics during race
  async updateMetrics({
    speed,
    position,
    lap,
    lapProgress,
    currentPosition,
    previousPosition,
    turnDirection,
    angle,
    acceleration,
  }) {
    let derivedTurn = turnDirection || null;

    // Detect turn direction if not provided
    if (!derivedTurn && previousPosition && currentPosition) {
      const prevAngle = Math.atan2(previousPosition[0], previousPosition[2]);
      const currAngle = Math.atan2(currentPosition[0], currentPosition[2]);
      let angleDiff = currAngle - prevAngle;

      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

      if (Math.abs(angleDiff) > 0.1) {
        derivedTurn = angleDiff > 0 ? "left" : "right";
      }
    }

    const parsePosition = () => {
      if (Array.isArray(position)) {
        return {
          x: position[0] ?? 0,
          y: position[2] ?? position[1] ?? 0,
        };
      }

      if (position && typeof position === "object") {
        return {
          x:
            position.x ?? position[0] ?? position.latitude ?? position.lon ?? 0,
          y:
            position.y ??
            position[2] ??
            position.longitude ??
            position.lat ??
            0,
        };
      }

      if (currentPosition && Array.isArray(currentPosition)) {
        return {
          x: currentPosition[0] ?? 0,
          y: currentPosition[2] ?? currentPosition[1] ?? 0,
        };
      }

      return null;
    };

    const coordinates = parsePosition();

    try {
      const response = await fetch(`${API_URL}/api/races/metrics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenId: this.tokenId,
          speed,
          position: coordinates,
          x: coordinates?.x,
          y: coordinates?.y,
          lap,
          lapProgress,
          turnDirection: derivedTurn,
          angle,
          acceleration,
        }),
      });

      if (!response.ok) {
        console.warn("Failed to update metrics");
      }
    } catch (error) {
      console.error("Error updating metrics:", error);
    }
  }

  // Get current metrics
  async getMetrics() {
    try {
      const response = await fetch(
        `${API_URL}/api/races/metrics/${this.tokenId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch metrics");
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching metrics:", error);
      return null;
    }
  }
}
