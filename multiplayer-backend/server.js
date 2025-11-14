const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const os = require("os");
require("dotenv").config();

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

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    service: "multiplayer-racing-backend",
    version: "1.0.0",
  });
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
    activeRooms: Array.from(racingRooms.keys()),
    totalPlayers: Array.from(racingRooms.values()).reduce(
      (sum, room) => sum + room.size,
      0
    ),
  });
});

// Get room info
app.get("/api/rooms/:roomId", (req, res) => {
  const { roomId } = req.params;
  const room = racingRooms.get(roomId);

  if (!room) {
    return res.status(404).json({ error: "Room not found" });
  }

  const players = Array.from(room.values());
  res.json({
    roomId,
    playerCount: players.length,
    players: players.map((p) => ({
      playerId: p.playerId,
      position: p.position,
      speed: p.speed,
      lastUpdate: p.timestamp,
    })),
  });
});

// Get all rooms
app.get("/api/rooms", (req, res) => {
  const rooms = Array.from(racingRooms.entries()).map(([roomId, room]) => ({
    roomId,
    playerCount: room.size,
    players: Array.from(room.keys()),
  }));

  res.json({ rooms, totalRooms: rooms.length });
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`✅ Client connected: ${socket.id}`);

  socket.on("disconnect", (reason) => {
    console.log(`❌ Client disconnected: ${socket.id} (${reason})`);

    // Clean up player from room
    const { playerId, roomId } = socket.data;
    if (playerId && roomId) {
      const room = racingRooms.get(roomId);
      if (room && room.has(playerId)) {
        room.delete(playerId);
        const roomKey = `race_${roomId}`;
        socket.to(roomKey).emit("playerLeft", { playerId });

        console.log(`Player ${playerId} left room ${roomId}`);

        // Clean up empty rooms
        if (room.size === 0) {
          racingRooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        }
      }
    }
  });

  // Join a race room
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
      console.log(`📦 Created new room: ${roomId}`);
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

      console.log(
        `👤 Player ${playerId} joined room ${roomId} (${room.size} players)`
      );
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

  // Leave a race room
  socket.on("leaveRace", ({ playerId, roomId }) => {
    if (!playerId || !roomId) return;

    const roomKey = `race_${roomId}`;
    socket.leave(roomKey);

    const room = racingRooms.get(roomId);
    if (room && room.has(playerId)) {
      room.delete(playerId);

      // Notify room that player left
      socket.to(roomKey).emit("playerLeft", { playerId });

      console.log(`👋 Player ${playerId} left room ${roomId}`);

      // Clean up empty rooms
      if (room.size === 0) {
        racingRooms.delete(roomId);
        console.log(`📦 Room ${roomId} deleted (empty)`);
      }
    }

    socket.data.playerId = null;
    socket.data.roomId = null;
  });

  // Handle player position updates
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

  // Ping/pong for connection health
  socket.on("ping", () => {
    socket.emit("pong", { timestamp: Date.now() });
  });
});

const PORT = process.env.PORT || 5003;
const HOST = process.env.HOST || "0.0.0.0"; // Bind to all interfaces

server.listen(PORT, HOST, () => {
  console.log(`\n🚀 Multiplayer Racing Backend Server`);
  console.log(`═══════════════════════════════════════`);
  console.log(`📍 Server accessible at:`);
  console.log(`   - Local:    http://localhost:${PORT}`);

  const localIPs = getLocalIPs();
  if (localIPs.length > 0) {
    const networkIP = HOST === "0.0.0.0" ? localIPs[0] : HOST;
    console.log(`   - Network:  http://${networkIP}:${PORT}`);
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
  console.log(`═══════════════════════════════════════\n`);
});
