# 🎮 Multiplayer Setup Guide

This guide explains how to set up and use the multiplayer functionality in the F1 Racing game.

## 🚀 Quick Start

### 1. Install Dependencies

First, make sure you have all dependencies installed:

```bash
cd car-physics
npm install
```

### 2. Start the Backend Server

The backend server must be running for multiplayer to work:

```bash
cd ../backend
npm install  # if not already done
npm start
```

The server will run on `http://localhost:5002` by default.

### 3. Configure Server URL (Optional)

If your backend server is running on a different URL, create a `.env` file in the `car-physics` directory:

```env
REACT_APP_SERVER_URL=http://localhost:5002
```

### 4. Start the Game

```bash
cd car-physics
npm start
```

The game will open at `http://localhost:3000` (or another port if 3000 is busy).

## 🎯 How It Works

### Player Connection

- Each player gets a unique ID stored in localStorage
- Players automatically join the "default-race" room when they connect
- The game shows connection status in the HUD

### Real-time Synchronization

- **Position Updates**: Sent 10 times per second (every 100ms)
- **Smooth Interpolation**: Remote cars smoothly interpolate to their target positions
- **Color Coding**: Each player gets a unique color for easy identification

### Room System

Players can join different rooms. To change rooms programmatically:

```javascript
// In your component
const { joinRoom, leaveRoom } = useMultiplayer(playerId);

// Join a specific room
joinRoom("my-custom-room");

// Leave current room
leaveRoom();
```

## 🔧 Architecture

### Frontend Components

- **`useMultiplayer.js`**: Custom hook that manages WebSocket connection
- **`RemoteCar.jsx`**: Component that renders other players' cars
- **`F1Car.jsx`**: Updated to send position updates via WebSocket
- **`F1RacingScene.jsx`**: Updated to render all players

### Backend Events

The server handles these Socket.IO events:

- `joinRace`: Player joins a racing room
- `leaveRace`: Player leaves a racing room
- `playerPositionUpdate`: Broadcasts player position to others
- `playerJoined`: Notifies room when a player joins
- `playerLeft`: Notifies room when a player leaves
- `playerUpdate`: Receives position updates from other players
- `roomPlayers`: Gets list of all players in the room

## 🎮 Testing Multiplayer

1. **Open Multiple Windows**: Open the game in multiple browser windows/tabs
2. **Check Connection**: Look for the "Multiplayer" status in the HUD
3. **See Other Players**: You should see other players' cars in different colors
4. **Move Around**: Drive your car and watch others see your movements in real-time

## 🐛 Troubleshooting

### Connection Issues

- **"✗ Offline" in HUD**:
  - Check if backend server is running
  - Verify `REACT_APP_SERVER_URL` matches your server URL
  - Check browser console for connection errors

### Players Not Appearing

- **Check Network Tab**: Verify WebSocket connection is established
- **Check Server Logs**: Look for "Player joined" messages
- **Verify Room**: Make sure all players are in the same room

### Performance Issues

- **Reduce Update Rate**: Modify `UPDATE_INTERVAL` in `useMultiplayer.js` (default: 100ms)
- **Limit Players**: Consider implementing a max player limit per room
- **Optimize Rendering**: Reduce quality settings if needed

## 🔐 Security Considerations

Currently, the multiplayer system uses:

- **No Authentication**: Anyone can join with any playerId
- **No Rate Limiting**: Position updates are not rate-limited
- **In-Memory Storage**: Player data is lost on server restart

For production, consider:

- Adding authentication/authorization
- Implementing rate limiting
- Using Redis or database for persistent room storage
- Adding input validation and anti-cheat measures

## 📝 Environment Variables

### Frontend (`car-physics/.env`)

```env
REACT_APP_SERVER_URL=http://localhost:5002
```

### Backend (`backend/.env`)

```env
PORT=5002
FRONTEND_URL=http://localhost:3000,http://localhost:3001
```

## 🎨 Customization

### Change Update Rate

Edit `car-physics/src/hooks/useMultiplayer.js`:

```javascript
const UPDATE_INTERVAL = 50; // 20 updates per second (more responsive)
```

### Change Interpolation Speed

Edit `car-physics/src/components/RemoteCar.jsx`:

```javascript
// Faster interpolation (more responsive but may be jittery)
meshRef.current.position.lerp(targetPositionRef.current, 0.4);
meshRef.current.quaternion.slerp(targetRotationRef.current, 0.4);
```

### Add More Player Colors

Edit `car-physics/src/components/RemoteCar.jsx`:

```javascript
const colors = [
  "#FF0000", // Add more colors here
  // ...
];
```

## 🚀 Next Steps

- Add player names/usernames
- Implement race start/end logic
- Add lap counting for multiplayer
- Create leaderboard system
- Add chat functionality
- Implement collision detection between players
- Add spectate mode

Enjoy racing! 🏁
