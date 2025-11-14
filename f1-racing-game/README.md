# F1 Racing Game - TurboTradeX

A 3D F1 racing game built with React Three Fiber and Cannon.js physics engine.

## Features

- 🏎️ Realistic F1 car physics
- 🏁 Oval racing track with boundaries
- 📊 Real-time HUD (speed, lap count, position)
- 🎮 Keyboard controls (WASD/Arrow keys)
- 📷 Third-person camera with toggle
- ⚡ Smooth performance with React Three Fiber

## Installation

```bash
npm install
```

## Running

```bash
npm start
```

The game will open at `http://localhost:3000`

## Controls

- **W / ↑** - Accelerate
- **S / ↓** - Brake/Reverse
- **A / ←** - Turn Left
- **D / →** - Turn Right
- **K** - Toggle Camera (Third-person/First-person)
- **R** - Reset Car Position

## Technologies

- React 18
- React Three Fiber
- React Three Cannon
- Three.js
- React Three Drei

## Project Structure

```
f1-racing-game/
├── src/
│   ├── components/
│   │   ├── F1Car.jsx          # F1 car component with physics
│   │   ├── F1Track.jsx        # Racing track component
│   │   └── F1RacingScene.jsx   # Main scene setup
│   ├── hooks/
│   │   ├── useF1Controls.jsx   # Keyboard controls hook
│   │   └── useF1Wheels.jsx    # Wheel physics hook
│   ├── App.css                 # Styles
│   └── index.js                # Entry point
├── public/
│   └── index.html
└── package.json
```

## License

MIT

