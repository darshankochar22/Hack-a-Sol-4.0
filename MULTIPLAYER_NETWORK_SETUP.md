# 🌐 Multiplayer Network Setup Guide

This guide explains how to set up multiplayer racing across different devices on your local network.

## 🚀 Quick Setup

### Step 1: Start the Multiplayer Backend Server

```bash
cd multiplayer-backend
npm install  # if not already done
npm start
```

The server will display:

- Local URL: `http://localhost:5003`
- Network IPs: `http://192.168.x.x:5003` (your actual IP)

**Note the network IP address** - you'll need it for the frontend!

> **Note:** This is a separate backend dedicated to multiplayer. The main `backend` folder is for other services.

### Step 2: Configure Frontend for Network Connection

#### Option A: Using Environment Variable (Recommended)

1. Create a `.env` file in the `car-physics` directory:

```bash
cd car-physics
```

2. Add your server's network IP:

```env
REACT_APP_SERVER_URL=http://192.168.1.100:5003
```

Replace `192.168.1.100` with the IP shown in the backend server logs.

3. Restart the React app:

```bash
npm start
```

#### Option B: Manual Configuration

If you don't want to use environment variables, you can edit:
`car-physics/src/hooks/useMultiplayer.js`

Change line 4:

```javascript
const SERVER_URL = "http://YOUR_IP:5002";
```

### Step 3: Test Connection

1. Open the game in multiple browser windows/tabs or different devices
2. Check the browser console for connection status
3. Look for the "Multiplayer" status in the HUD (should show "✓ X players")
4. You should see other players' cars appear in different colors

## 🔍 Finding Your Server IP Address

### Windows

```bash
ipconfig
```

Look for "IPv4 Address" under your active network adapter (usually Wi-Fi or Ethernet).

### Mac/Linux

```bash
ifconfig
```

Look for `inet` address (usually starts with `192.168.` or `10.`).

### Alternative: Check Backend Logs

The backend server automatically displays all available network IPs when it starts.

## 🛠️ Troubleshooting

### "Connection Error" in Browser Console

**Problem:** Frontend can't connect to backend

**Solutions:**

1. ✅ Verify multiplayer-backend server is running
2. ✅ Check `REACT_APP_SERVER_URL` matches the server IP
3. ✅ Ensure both devices are on the same network
4. ✅ Check firewall settings (port 5003 must be open)
5. ✅ Try `http://localhost:5003` first to test locally

### "CORS Error" in Browser Console

**Problem:** Browser blocks cross-origin requests

**Solutions:**

1. ✅ Backend is configured to allow all origins in development
2. ✅ If still having issues, check `backend/.env` has `NODE_ENV=development`
3. ✅ For production, add your frontend URL to `FRONTEND_URL` in backend `.env`

### Players Not Appearing

**Problem:** Connected but can't see other players

**Solutions:**

1. ✅ Check browser console for "Player joined" messages
2. ✅ Verify both clients are in the same room ("default-race")
3. ✅ Check network tab - WebSocket connection should show "101 Switching Protocols"
4. ✅ Restart both frontend and backend

### Firewall Issues

**Windows:**

1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Add Node.js or allow port 5002

**Mac:**

1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Add Node.js or allow incoming connections on port 5002

**Linux:**

```bash
sudo ufw allow 5003
```

## 📱 Testing on Mobile Devices

1. **Find your computer's IP** (from backend logs)
2. **Ensure phone is on same Wi-Fi network**
3. **Access game from phone browser:**
   - If React app is on `http://localhost:3000`, you need to:
     - Start React with: `HOST=0.0.0.0 npm start`
     - Or use your computer's IP: `http://YOUR_IP:3000`
4. **Set `REACT_APP_SERVER_URL` to your backend IP** in `.env`

## 🌍 Production Deployment

For production (deployed servers):

### Backend `.env`:

```env
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com,https://www.your-frontend-domain.com
PORT=5002
HOST=0.0.0.0
```

### Frontend `.env`:

```env
REACT_APP_SERVER_URL=https://your-backend-domain.com
```

## 🔐 Security Notes

**Development Mode:**

- CORS allows all origins (convenient for testing)
- No authentication required
- Suitable for local network only

**Production Mode:**

- Set specific allowed origins in `FRONTEND_URL`
- Consider adding authentication
- Use HTTPS for secure connections
- Implement rate limiting

## 📊 Network Diagnostics

The backend provides a diagnostics endpoint:

```bash
curl http://YOUR_IP:5002/api/network
```

This returns:

- Server port and host
- Available network IPs
- Recommended connection URL
- CORS configuration

## ✅ Checklist

Before testing multiplayer:

- [ ] Backend server is running and shows network IPs
- [ ] Frontend `.env` has correct `REACT_APP_SERVER_URL`
- [ ] Both devices are on the same network
- [ ] Firewall allows port 5002
- [ ] Browser console shows "✅ Connected to multiplayer server"
- [ ] HUD shows "✓ X players" (where X > 1)

## 🎮 Testing Multiplayer

1. **Open game in Browser 1** (on your computer)
2. **Open game in Browser 2** (different tab, window, or device)
3. **Check leaderboard** - should show both players
4. **Drive around** - you should see the other player's car moving
5. **Check speeds** - leaderboard shows each player's speed
6. **Check positions** - leaderboard shows who's ahead/behind

Enjoy racing! 🏁
