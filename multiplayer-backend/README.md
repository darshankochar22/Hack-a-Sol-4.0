# 🎮 Multiplayer Racing Backend

A dedicated WebSocket backend server for the multiplayer F1 racing game.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Start Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## 📋 Features

- ✅ Real-time multiplayer synchronization
- ✅ Room-based racing system
- ✅ Player position tracking
- ✅ Speed and rotation updates
- ✅ Automatic room management
- ✅ Network IP detection
- ✅ Health check endpoint
- ✅ Room information API

## 🔧 Configuration

Create a `.env` file (or copy from `.env.example`):

```env
PORT=5003
HOST=0.0.0.0
NODE_ENV=development
FRONTEND_URL=
```

### Environment Variables

- **PORT**: Server port (default: 5003)
- **HOST**: Server host (default: 0.0.0.0 - all interfaces)
- **NODE_ENV**: Environment mode (development/production)
- **FRONTEND_URL**: Comma-separated list of allowed frontend URLs (empty = allow all in dev)

## 🌐 Network Setup

The server automatically detects and displays network IPs on startup:

```
🌐 Network IPs for multiplayer:
   - http://192.168.1.100:5003
   - http://10.0.0.5:5003

💡 Frontend clients should connect to: http://192.168.1.100:5003
```

## 📡 API Endpoints

### Health Check

```
GET /health
```

Returns server status and version.

### Network Diagnostics

```
GET /api/network
```

Returns network information, active rooms, and player count.

### Get All Rooms

```
GET /api/rooms
```

Returns list of all active rooms.

### Get Room Info

```
GET /api/rooms/:roomId
```

Returns detailed information about a specific room.

## 🔌 WebSocket Events

### Client → Server

#### `joinRace`

Join a racing room.

```javascript
socket.emit("joinRace", {
  playerId: "player_123",
  roomId: "default-race",
});
```

#### `leaveRace`

Leave the current room.

```javascript
socket.emit("leaveRace", {
  playerId: "player_123",
  roomId: "default-race",
});
```

#### `playerPositionUpdate`

Send position update (throttled on client side).

```javascript
socket.emit("playerPositionUpdate", {
  playerId: "player_123",
  roomId: "default-race",
  position: [x, y, z],
  rotation: { x, y, z, w },
  speed: 10.5,
  timestamp: Date.now(),
});
```

#### `ping`

Health check ping.

```javascript
socket.emit("ping");
```

### Server → Client

#### `roomAssigned`

Confirmation that room was joined.

```javascript
socket.on("roomAssigned", ({ roomId }) => {
  console.log("Joined room:", roomId);
});
```

#### `roomPlayers`

List of all players in the room.

```javascript
socket.on("roomPlayers", ({ players }) => {
  console.log("Players in room:", players);
});
```

#### `playerJoined`

Notification that a player joined the room.

```javascript
socket.on("playerJoined", (data) => {
  console.log("Player joined:", data.playerId);
});
```

#### `playerLeft`

Notification that a player left the room.

```javascript
socket.on("playerLeft", ({ playerId }) => {
  console.log("Player left:", playerId);
});
```

#### `playerUpdate`

Position update from another player.

```javascript
socket.on("playerUpdate", (data) => {
  console.log("Player update:", data.playerId, data.position);
});
```

#### `pong`

Response to ping.

```javascript
socket.on("pong", ({ timestamp }) => {
  console.log("Server responded at:", timestamp);
});
```

## 🧪 Testing

### Test Connection

```bash
curl http://localhost:5003/health
```

### Check Network Info

```bash
curl http://localhost:5003/api/network
```

### List Rooms

```bash
curl http://localhost:5003/api/rooms
```

## 🐛 Troubleshooting

### Port Already in Use

Change the port in `.env`:

```env
PORT=5004
```

### Can't Connect from Other Devices

1. Check firewall allows port 5003
2. Verify both devices are on same network
3. Use the network IP shown in server logs (not localhost)

### CORS Errors

- In development: CORS allows all origins automatically
- In production: Set `FRONTEND_URL` in `.env`

## 📊 Monitoring

The server logs:

- Client connections/disconnections
- Room creation/deletion
- Player joins/leaves
- Network IPs on startup

## 🔒 Production Considerations

1. Set `NODE_ENV=production`
2. Configure `FRONTEND_URL` with specific allowed origins
3. Use HTTPS (requires reverse proxy like nginx)
4. Consider adding authentication
5. Implement rate limiting
6. Use Redis for room storage (instead of in-memory)

## 📝 License

ISC
