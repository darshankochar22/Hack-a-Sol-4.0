const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const os = require("os");
require("dotenv").config();

const racingContract = require("./services/racingContract");

const app = express();
const server = http.createServer(app);

// CORS configuration - allow all origins in development, specific in production
const isDevelopment = process.env.NODE_ENV !== "production";
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(",")
  : isDevelopment
  ? true // Allow all origins in development
  : ["http://localhost:3000", "http://localhost:3001"];

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

const DASHBOARD_ROOM = "race-dashboard";

// Multiplayer racing rooms - stores player data by room
const racingRooms = new Map(); // roomId -> Map(playerId -> playerData)

// Get local network IP addresses
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

// CORS middleware - match Socket.IO CORS settings
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Initialize contract listeners
racingContract
  .init()
  .then(() => {
    console.log("✅ Racing contract service initialized");
  })
  .catch((error) => {
    console.error("Failed to initialize contract service", error);
    process.exit(1);
  });

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Network diagnostics endpoint
app.get("/api/network", (req, res) => {
  const localIPs = getLocalIPs();
  res.json({
    port: PORT,
    host: HOST,
    localIPs: localIPs,
    recommendedUrl:
      localIPs.length > 0 ? `http://${localIPs[0]}:${PORT}` : null,
    isDevelopment: isDevelopment,
    cors: {
      allowedOrigins: allowedOrigins === true ? "all" : allowedOrigins,
    },
  });
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

  // Multiplayer Racing Events
  socket.on("joinRace", ({ playerId, roomId }) => {
    if (!playerId || !roomId) {
      socket.emit("error", { message: "playerId and roomId are required" });
      return;
    }

    const roomKey = `race_${roomId}`;
    socket.join(roomKey);

    // Initialize room if it doesn't exist
    if (!racingRooms.has(roomId)) {
      racingRooms.set(roomId, new Map());
    }

    const room = racingRooms.get(roomId);

    // Add player to room
    if (!room.has(playerId)) {
      room.set(playerId, {
        playerId,
        position: [0, 0.3, 0],
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        speed: 0,
        timestamp: Date.now(),
      });

      // Notify room that player joined
      socket.to(roomKey).emit("playerJoined", {
        playerId,
        position: [0, 0.3, 0],
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        timestamp: Date.now(),
      });

      console.log(`Player ${playerId} joined room ${roomId}`);
    }

    // Send room assignment confirmation
    socket.emit("roomAssigned", { roomId });

    // Send all current players in the room
    const players = Array.from(room.values());
    socket.emit("roomPlayers", { players });

    // Store socket ID for cleanup on disconnect
    socket.data.playerId = playerId;
    socket.data.roomId = roomId;
  });

  socket.on("leaveRace", ({ playerId, roomId }) => {
    if (!playerId || !roomId) return;

    const roomKey = `race_${roomId}`;
    socket.leave(roomKey);

    const room = racingRooms.get(roomId);
    if (room && room.has(playerId)) {
      room.delete(playerId);

      // Notify room that player left
      socket.to(roomKey).emit("playerLeft", { playerId });

      console.log(`Player ${playerId} left room ${roomId}`);

      // Clean up empty rooms
      if (room.size === 0) {
        racingRooms.delete(roomId);
      }
    }

    socket.data.playerId = null;
    socket.data.roomId = null;
  });

  socket.on(
    "playerPositionUpdate",
    ({ playerId, roomId, position, rotation, speed, timestamp }) => {
      if (!playerId || !roomId) return;

      const room = racingRooms.get(roomId);
      if (!room) return;

      // Update player data
      room.set(playerId, {
        playerId,
        position: position || [0, 0.3, 0],
        rotation: rotation || { x: 0, y: 0, z: 0, w: 1 },
        speed: speed || 0,
        timestamp: timestamp || Date.now(),
      });

      // Broadcast update to all other players in the room
      const roomKey = `race_${roomId}`;
      socket.to(roomKey).emit("playerUpdate", {
        playerId,
        position,
        rotation,
        speed,
        timestamp,
      });
    }
  );

  // Clean up on disconnect
  socket.on("disconnect", () => {
    const { playerId, roomId } = socket.data;
    if (playerId && roomId) {
      const room = racingRooms.get(roomId);
      if (room && room.has(playerId)) {
        room.delete(playerId);
        const roomKey = `race_${roomId}`;
        socket.to(roomKey).emit("playerLeft", { playerId });

        // Clean up empty rooms
        if (room.size === 0) {
          racingRooms.delete(roomId);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5002;
const HOST = process.env.HOST || "0.0.0.0"; // Bind to all interfaces

server.listen(PORT, HOST, () => {
  console.log(`🚀 Race backend server running on port ${PORT}`);
  console.log(`📍 Server accessible at:`);
  console.log(`   - Local:    http://localhost:${PORT}`);
  console.log(
    `   - Network:  http://${
      HOST === "0.0.0.0" ? getLocalIPs()[0] || "your-ip" : HOST
    }:${PORT}`
  );

  const localIPs = getLocalIPs();
  if (localIPs.length > 0) {
    console.log(`\n🌐 Network IPs for multiplayer:`);
    localIPs.forEach((ip) => {
      console.log(`   - http://${ip}:${PORT}`);
    });
    console.log(
      `\n💡 Frontend clients should connect to: http://${localIPs[0]}:${PORT}`
    );
  } else {
    console.log(
      `\n⚠️  Could not detect network IP. Check your network settings.`
    );
  }

  console.log(`\n🔌 WebSocket server ready for connections`);
  if (isDevelopment) {
    console.log(`⚠️  Development mode: CORS allows all origins`);
  }
});
