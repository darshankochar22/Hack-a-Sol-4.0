# 🎮 Hosting Multiplayer Games Guide

This guide explains how to host a multiplayer racing game so other players on your network can join.

## 🚀 Quick Start for Host

### Step 1: Start Your Backend Server

```bash
cd multiplayer-backend
npm install  # if not already done
npm start
```

**Important:** Note the network IP address shown in the logs:

```
🌐 Network IPs for multiplayer:
   - http://192.168.1.100:5003
   - http://10.0.0.5:5003

💡 Frontend clients should connect to: http://192.168.1.100:5003
```

### Step 2: Share Your IP Address

Share the network IP address (e.g., `192.168.1.100`) with other players. They'll need this to connect to your server.

**Ways to share:**

- Tell them the IP address: `192.168.1.100`
- Or the full URL: `http://192.168.1.100:5003`
- Show them your backend server terminal (they can see the IP there)

### Step 3: Start Your Game

```bash
cd car-physics
npm start
```

Your game will connect to `localhost:5003` automatically.

## 👥 Quick Start for Players (Joining Host)

### Step 1: Start the Game

```bash
cd car-physics
npm start
```

### Step 2: Connect to Host's Server

1. **Click the connection status button** (top-left corner)

   - Shows "🔴 Disconnected" if not connected
   - Shows "🟢 Connected" if connected

2. **Enter the host's IP address:**

   - Click the connection button to open settings
   - Enter: `http://HOST_IP:5003`
   - Example: `http://192.168.1.100:5003`
   - Click "Connect"

3. **Or use Quick Connect:**
   - Click "Enter IP" button
   - Type the host's IP (e.g., `192.168.1.100`)
   - It will automatically format as `http://192.168.1.100:5003`

### Step 3: Start Racing!

Once connected, you'll see:

- Connection status: "🟢 Connected"
- Other players in the leaderboard
- Other players' cars on the track

## 🔍 Finding Your IP Address (Host)

### Windows

```bash
ipconfig
```

Look for "IPv4 Address" under your active network adapter.

### Mac/Linux

```bash
ifconfig
```

Look for `inet` address (usually starts with `192.168.` or `10.`).

### Or Check Backend Logs

The backend server automatically displays your IP when it starts:

```
🌐 Network IPs for multiplayer:
   - http://192.168.1.100:5003
```

## ✅ Checklist for Host

Before others can join:

- [ ] Backend server is running (`npm start` in `multiplayer-backend`)
- [ ] Backend shows network IP addresses in logs
- [ ] Firewall allows connections on port 5003
- [ ] You're on the same network as other players (same Wi-Fi/router)
- [ ] You've shared your IP address with other players

## ✅ Checklist for Players

Before joining:

- [ ] Host's backend server is running
- [ ] You have the host's IP address
- [ ] You're on the same network as the host
- [ ] You've entered the correct server URL in connection settings
- [ ] Connection status shows "🟢 Connected"

## 🐛 Troubleshooting

### Host: "Players can't connect"

**Check:**

1. ✅ Backend is running and shows network IPs
2. ✅ Firewall allows port 5003
3. ✅ You're on the same network
4. ✅ Backend shows "🔌 WebSocket server ready for connections"

**Windows Firewall:**

- Windows Defender → Allow an app → Add Node.js or port 5003

**Mac Firewall:**

- System Preferences → Security → Firewall → Allow Node.js

**Linux:**

```bash
sudo ufw allow 5003
```

### Player: "Can't connect to server"

**Check:**

1. ✅ Host's backend is running
2. ✅ You entered the correct IP address
3. ✅ IP format is correct: `http://192.168.1.100:5003` (not just the IP)
4. ✅ You're on the same network
5. ✅ Try "localhost" if you're the host: `http://localhost:5003`

**Test Connection:**
Open in browser: `http://HOST_IP:5003/health`
Should return: `{"status":"ok",...}`

### "Connection Error" in Browser Console

**Solutions:**

1. Verify host's IP address is correct
2. Check host's backend is running
3. Ensure both devices on same network
4. Check firewall settings
5. Try pinging the host: `ping HOST_IP`

## 📱 Mobile Devices

Players can join from mobile devices too!

1. **Host:** Share your IP address
2. **Mobile Player:**
   - Open game in mobile browser
   - Use connection settings to enter host's IP
   - Connect and race!

**Note:** Mobile device must be on the same Wi-Fi network.

## 🌐 Network Requirements

### Same Network

All players (including host) must be on the **same local network**:

- Same Wi-Fi network, OR
- Same router/switch, OR
- Same LAN

### Port Forwarding (Advanced)

For players on different networks, you'd need to:

1. Set up port forwarding on your router
2. Use your public IP address
3. Configure firewall rules

**Not recommended for casual play** - stick to same network for best experience.

## 🎯 Example Scenario

**Host (Alice):**

```bash
# Terminal 1: Start backend
cd multiplayer-backend
npm start
# Shows: http://192.168.1.100:5003

# Terminal 2: Start game
cd car-physics
npm start
# Connects to localhost:5003 automatically
```

**Player (Bob):**

```bash
# Start game
cd car-physics
npm start

# In game:
# 1. Click connection button (top-left)
# 2. Enter: http://192.168.1.100:5003
# 3. Click "Connect"
# 4. See "🟢 Connected"
# 5. Start racing!
```

## 💡 Tips

1. **Host should keep backend running** - Don't close the backend terminal
2. **Share IP clearly** - Write it down or send via message
3. **Test locally first** - Host should test with localhost before sharing
4. **Check connection status** - Green = good, Red = needs fixing
5. **Restart if needed** - Sometimes reconnecting helps

## 🎮 Enjoy Racing!

Once everyone is connected, you'll see:

- All players in the leaderboard
- Real-time position updates
- Speed tracking
- Who's ahead/behind

Have fun racing! 🏁
