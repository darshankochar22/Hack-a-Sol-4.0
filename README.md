# TurboTradeX — Decentralized F1 GameFi Exchange

TurboTradeX is a Web3-powered racing–economy simulator where AI-driven F1-inspired racers compete in virtual tournaments, and every race moment dynamically affects the live on-chain market value of racer NFTs.  
Players don’t just watch the race — they own, trade, bid, and speculate on racers whose values fluctuate in real time based on performance, AI strategy, and market movements.

Think Formula 1 × Stock Market × GameFi.

---

## 🏎️ Core Concept

Each racer in TurboTradeX is represented as an NFT.  
An AI-driven valuation engine continuously updates its value based on:

- Overtakes  
- Crashes or performance drops  
- Speed and lap-time improvements  
- Market speculation  
- Active bidding pressure  
- Race momentum trends  

This creates a **live financial ecosystem** where both racing strategy and trading instincts determine profit.

---

## 📌 Features

### **1. Real-Time AI-Simulated F1 Racing**
- AI racers have stats like speed, cornering, stability, aggression, consistency, and reflexes.
- Race simulation generates lap-by-lap telemetry.
- Visual updates via WebSocket.

---

### **2. Dynamic NFT Pricing Engine**
- Prices are updated continuously using:
  - Performance score  
  - Momentum score  
  - Market interest  
  - Auction pressure  
  - Volatility curve  
- A weighted model calculates the real-time value of each racer.
- Values can spike instantly when pivotal events occur (e.g., overtake, crash).

---

### **3. Real-Time Auctions (Core Gameplay Loop)**
- Users can bid during:
  - Pre-race auctions  
  - Live race auctions  
  - Post-race settlements  
- Highest bidder wins the NFT with instant ownership transfer.
- Bidding influences the valuation score.

**Here is the bidding page:**  
*(Insert screenshot here)*

---

### **4. Trader Dashboard**
The dashboard displays:

- Live charts  
- Recent trades  
- Market depth  
- Active auctions  
- Personal holdings  
- Price movement indicators  

**Here is the trader dashboard:**  
*(Insert screenshot here)*

---

### **5. Game Page / Race Viewer**
Displays real-time race visuals:

- Racer positions  
- Lap count  
- Speed indicators  
- Gap times  
- Track map (if implemented)  
- Price impact markers showing which racer gained/lost value  

**Here’s the game page:**  
*(Insert screenshot here)*

---

### **6. Wallet, Authentication & Profile**
- Users connect via MetaMask/WalletConnect  
- Wallet displays owned racers  
- Users can buy, sell, stake, and participate in auctions  

**Here is the wallet/profile page:**  
*(Insert screenshot here)*

---

### **7. NFT Detail Page**
Shows the racer's:

- Stats  
- AI profile  
- Price history chart  
- Ownership history  
- Live performance metrics  

**Here is the NFT detail page:**  
*(Insert screenshot here)*

---

## 📂 Project Structure

```text
root/
├── client/                     # Frontend (React)
│   └── src/
│       ├── components/         # UI Components
│       ├── pages/              # Game, Auction, Dashboard screens
│       ├── context/            # State management
│       ├── hooks/              # Custom React hooks
│       ├── assets/             # Images and static files
│       ├── utils/              # Helper functions
│       └── App.jsx
│
├── server/                     # Backend (Node.js / Express)
│   ├── routes/                 # REST endpoints
│   ├── controllers/            # Business logic
│   ├── services/               # Auction engine, race engine
│   ├── sockets/                # WebSocket handlers
│   ├── models/                 # DB models
│   └── index.js
│
├── smart-contracts/            # Solidity contracts
│   ├── NFT.sol
│   ├── Marketplace.sol
│   ├── Auction.sol
│   └── utils/
│
├── assets/                     # UI mockups or images
├── utils/                      # Shared utilities
└── README.md
```


---

## 🧠 AI Valuation Engine (Detailed Overview)

The valuation engine uses:

### **1. Performance Score**
Based on:
- Lap time improvements  
- Average speed  
- Position gains  
- Crash penalties  

### **2. Momentum Score**
Short-term and long-term momentum indicators determine whether the NFT should trend upward or downward.

### **3. Market Demand Score**
- Number of active bidders  
- Number of watchers/traders  
- Volume of recent trades  

### **4. Auction Influence**
If bidding activity spikes, the price temporarily surges.

### **5. Volatility Indicator**
Simulates market ups/downs for dramatic effects during tense race moments.

### 📘 Final Price Formula

```text
Final_Valuation = 
    (Performance * W1) + (Momentum * W2) + (Demand * W3) + 
    (Auction_Pressure * W4) + (Volatility * W5)
```

**Note:**  
Weights **W1–W5** are tunable depending on game physics.

---

## ⚡ Innovation Scope (Hackathon Problem Statement)

TurboTradeX can integrate **real-world F1 telemetry**, enabling:

- Live race-linked pricing  
- Real driver-based NFT assets  
- Prediction markets for real F1 outcomes  
- Staking on real teams/drivers  
- Real-time speculation as real F1 races progress  
- Simulated markets that mirror actual F1 performance  

This merges Web3 trading with global motorsports analytics.

---

## 🚀 Tech Stack

### **Frontend**
- React.js  
- TailwindCSS  
- Socket.io-client  
- Chart.js / Recharts  
- Web3.js / Ethers.js  

### **Backend**
- Node.js  
- Express.js  
- Socket.io  
- MongoDB / PostgreSQL  
- Auction Engine  
- Race Simulation Engine  

### **Smart Contracts**
- Solidity  
- ERC-721 NFTs  
- Auction logic  
- Ownership/transfer logic  
- Optional oracle integration  

---

## 🕹️ Gameplay / User Flow

### **1. Enter Platform**
- Wallet connect  
- Dashboard overview  

### **2. Choose Racer NFT**
- Check stats  
- Analyze graphs  
- Join auction  

### **3. Race Starts**
- AI simulation generates events  
- Live telemetry pushed to frontend  

### **4. Market Responds**
- Price updated every event  
- Users bid, buy, sell  

### **5. Race Ends**
- Final positions shown  
- Final prices settled  
- Ownership transfers completed  

---

## 📸 Screenshots of the Web Page

![Web Page](/Img1.jpeg)
![Web Page](/Img2.jpeg)
![Web Page](/Img3.jpeg)
![Web Page](/Img4.jpeg)


---
## 📦 Installation & Setup Commands

### 1. Install Frontend Dependencies
```bash
cd client
npm install
```

### 2. Install Backend Dependencies
```bash
cd ../server
npm install
```

### 3. Run Backend
```bash
npm start
```

### 4. Run Frontend
```bash
npm run dev
```

### 5. Compile Smart Contracts
```bash
cd smart-contracts
npx hardhat compile
```

## 🛡️ Future Enhancements

- Real-time global tournaments  
- Cross-chain support (Polygon, Arbitrum, Solana)  
- VR/AR race viewer  
- In-game upgrades for NFT racers  
- Skin marketplace  
- Option to deploy fully on-chain race simulations  
- AI-powered prediction market  
- Team-based trading leagues
