# 🏎️ F1 Racing Game - React Three Fiber

A simple F1-style racing game built with React Three Fiber and Cannon physics engine.

## 🎮 Features

- **3D Physics-Based Racing** - Realistic car physics using Cannon.js
- **F1-Style Controls** - Fast, responsive steering and acceleration
- **Third-Person Camera** - Follows the car smoothly
- **Lap Counter** - Tracks completed laps
- **Speed & Position HUD** - Real-time racing stats
- **Oval Track** - Simple but fun racing circuit

## 🚀 How to Run

1. **Navigate to the car-physics directory:**
   ```bash
   cd R3F-in-practice/car-physics
   ```

2. **Install dependencies (if not already installed):**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Open your browser:**
   - The app will open at `http://localhost:3000`

## 🎮 Controls

- **W / ↑ Arrow** - Accelerate
- **S / ↓ Arrow** - Brake/Reverse
- **A / ← Arrow** - Turn Left
- **D / → Arrow** - Turn Right
- **K** - Toggle Camera (Third-person / Free)
- **R** - Reset Car Position

## 📁 File Structure

```
src/
├── F1Car.jsx          # F1 car component with physics
├── F1Track.jsx        # Racing track with boundaries
├── F1RacingScene.jsx  # Main scene with camera and lighting
├── useF1Controls.jsx  # Keyboard controls hook
├── useF1Wheels.jsx    # Wheel physics setup
└── index.js           # Main app entry point
```

## 🎨 Customization

### Adjust Car Speed
Edit `useF1Controls.jsx`:
```javascript
vehicleApi.applyEngineForce(300, 2); // Increase for faster acceleration
```

### Adjust Steering
Edit `useF1Controls.jsx`:
```javascript
vehicleApi.setSteeringValue(0.5, 2); // Increase for sharper turns
```

### Change Track Size
Edit `F1Track.jsx`:
```javascript
const radius = 15; // Increase for larger track
```

## 🔧 Integration with TurboTradeX

This F1 racing game can be integrated with your TurboTradeX backend:

1. **Connect to WebSocket** - Send position updates to server
2. **Race Completion** - Trigger race completion when laps are done
3. **Multiplayer** - Add multiple cars for competitive racing
4. **NFT Integration** - Link car stats to NFT attributes

## 🎯 Next Steps

- Add multiple AI racers
- Create more complex tracks
- Add power-ups and obstacles
- Integrate with TurboTradeX race system
- Add sound effects and music

Enjoy racing! 🏁

