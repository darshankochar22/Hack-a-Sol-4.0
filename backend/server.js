const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const racingContract = require("./services/racingContract");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

const DASHBOARD_ROOM = "race-dashboard";

app.use(cors());
app.use(express.json());

// Initialize contract listeners (graceful - don't exit if it fails)
racingContract
  .init()
  .then(() => {
    console.log("✅ Racing contract service initialized");
  })
  .catch((error) => {
    console.error("⚠️  Failed to initialize contract service:", error.message);
    console.warn("   Service will continue but contract features may be unavailable");
    console.warn("   Ensure RACING_ENGINE_ADDRESS is set in .env for full functionality");
  });

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Races
app.get("/api/races", (req, res) => {
  const races = racingContract.getRacesSnapshot();
  res.json(races);
});

app.get("/api/races/:raceId", async (req, res) => {
  try {
    const race = await racingContract.getRaceById(req.params.raceId);
    if (!race) {
      return res.status(404).json({ error: "Race not found" });
    }
    res.json(race);
  } catch (error) {
    console.error("Failed to fetch race", error);
    res.status(500).json({ error: "Failed to fetch race" });
  }
});

// Telemetry
app.get("/api/races/:raceId/telemetry", async (req, res) => {
  const { raceId } = req.params;
  const { tokenId, limit = 50 } = req.query;

  if (!tokenId) {
    return res.status(400).json({ error: "tokenId query param is required" });
  }

  try {
    const snapshots = await racingContract.getTelemetrySnapshots(
      raceId,
      tokenId,
      Number(limit)
    );
    res.json({ raceId: Number(raceId), tokenId: Number(tokenId), snapshots });
  } catch (error) {
    console.error("Failed to fetch telemetry", error);
    res.status(500).json({ error: "Failed to fetch telemetry" });
  }
});

// Update telemetry (POST)
app.post("/api/races/:raceId/telemetry", async (req, res) => {
  const { raceId } = req.params;
  const {
    tokenId,
    positionX,
    positionY,
    speed,
    currentLap,
    lapProgress,
    acceleration,
  } = req.body;

  if (!tokenId) {
    return res.status(400).json({ error: "tokenId is required" });
  }

  try {
    const result = await racingContract.updateTelemetry(
      Number(raceId),
      Number(tokenId),
      {
        positionX: positionX || 0,
        positionY: positionY || 0,
        speed: speed || 0,
        currentLap: currentLap || 0,
        lapProgress: lapProgress || 0,
        acceleration: acceleration || 0,
      }
    );
    res.json({ success: true, txHash: result.txHash });
  } catch (error) {
    console.error("Failed to update telemetry", error);
    res.status(500).json({
      error: "Failed to update telemetry",
      message: error.message,
    });
  }
});

// Betting pools
app.get("/api/races/:raceId/betting", async (req, res) => {
  try {
    const pool = await racingContract.getBettingPool(req.params.raceId);
    res.json(pool);
  } catch (error) {
    console.error("Failed to fetch betting pool", error);
    res.status(500).json({ error: "Failed to fetch betting pool" });
  }
});

app.get("/api/races/:raceId/odds/:tokenId", async (req, res) => {
  const { raceId, tokenId } = req.params;
  try {
    const odds = await racingContract.getOdds(raceId, tokenId);
    res.json({ raceId: Number(raceId), tokenId: Number(tokenId), odds });
  } catch (error) {
    console.error("Failed to fetch odds", error);
    res.status(500).json({ error: "Failed to fetch odds" });
  }
});

// Dashboard snapshot
app.get("/api/dashboard/live", async (req, res) => {
  try {
    const snapshot = await racingContract.getDashboardSnapshot();
    res.json(snapshot);
  } catch (error) {
    console.error("Failed to build dashboard snapshot", error);
    res.status(500).json({ error: "Failed to fetch dashboard data" });
  }
});

// Markets endpoints
app.get("/api/markets", async (req, res) => {
  try {
    const markets = await racingContract.getMarkets();
    res.json(markets);
  } catch (error) {
    console.error("Failed to fetch markets", error);
    res.status(500).json({ error: "Failed to fetch markets" });
  }
});

app.get("/api/markets/:raceId", async (req, res) => {
  try {
    const market = await racingContract.getMarketByRaceId(req.params.raceId);
    if (!market) {
      return res.status(404).json({ error: "Race not found" });
    }
    res.json(market);
  } catch (error) {
    console.error("Failed to fetch market", error);
    res.status(500).json({ error: "Failed to fetch market" });
  }
});

app.get("/api/markets/:raceId/history", async (req, res) => {
  const { raceId } = req.params;
  const limit = Number(req.query.limit || 200);
  try {
    const history = racingContract.getOddsHistory(raceId, limit);
    res.json({ raceId: Number(raceId), history });
  } catch (error) {
    console.error("Failed to fetch market history", error);
    res.status(500).json({ error: "Failed to fetch market history" });
  }
});

// Socket.IO bridge
racingContract.events.on("raceCreated", (race) => {
  io.emit("raceCreated", race);
});

racingContract.events.on("raceFinished", (race) => {
  io.emit("raceFinished", race);
});

racingContract.events.on("bettingUpdated", (pool) => {
  io.emit("bettingUpdated", pool);
});

racingContract.events.on("bettingSettled", (pool) => {
  io.emit("bettingSettled", pool);
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

  socket.on("subscribeRace", async (raceId) => {
    socket.join(`race_${raceId}`);
    try {
      const race = await racingContract.getRaceById(raceId);
      socket.emit("raceSummary", race || null);
    } catch (error) {
      console.error("Failed to emit race summary", error);
    }
  });

  socket.on("subscribeDashboard", async () => {
    socket.join(DASHBOARD_ROOM);
    try {
      const snapshot = await racingContract.getDashboardSnapshot();
      socket.emit("dashboardSnapshot", snapshot);
    } catch (error) {
      console.error("Failed to emit dashboard snapshot", error);
    }
  });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`🚀 Race backend server running on port ${PORT}`);
});
