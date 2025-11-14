"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Navbar from "@/components/navbar"
import { useRouter } from "next/navigation"

export default function BetNowPage() {
  const router = useRouter()
  const [selectedRace, setSelectedRace] = useState<string | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null)
  const [betAmount, setBetAmount] = useState<string>("")
  const [betType, setBetType] = useState<"win" | "podium" | "fastest-lap">("win")

  const races = [
    { id: "1", name: "Bahrain Grand Prix", date: "2024-03-02", status: "upcoming" },
    { id: "2", name: "Saudi Arabian Grand Prix", date: "2024-03-09", status: "upcoming" },
    { id: "3", name: "Australian Grand Prix", date: "2024-03-24", status: "upcoming" },
    { id: "4", name: "Japanese Grand Prix", date: "2024-04-07", status: "upcoming" },
  ]

  const drivers = [
    { id: "1", name: "Max Verstappen", team: "Red Bull Racing", odds: 1.5 },
    { id: "2", name: "Lewis Hamilton", team: "Mercedes", odds: 3.2 },
    { id: "3", name: "Charles Leclerc", team: "Ferrari", odds: 4.5 },
    { id: "4", name: "Lando Norris", team: "McLaren", odds: 5.8 },
    { id: "5", name: "George Russell", team: "Mercedes", odds: 6.2 },
    { id: "6", name: "Carlos Sainz", team: "Ferrari", odds: 7.5 },
  ]

  const handlePlaceBet = () => {
    if (!selectedRace || !selectedDriver || !betAmount) {
      alert("Please fill in all fields")
      return
    }
    // Handle bet placement logic here
    alert(`Bet placed! ${betAmount} on ${drivers.find(d => d.id === selectedDriver)?.name} to ${betType}`)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="betting-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ff0000" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#betting-grid)" />
        </svg>
      </div>

      <div className="relative z-10 pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-4"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              BET NOW
            </h1>
            <div className="w-32 h-1 bg-red-600 mx-auto mb-4"></div>
            <p className="text-gray-400 text-sm tracking-widest uppercase">
              Place Your Bets on F1 Races
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Race Selection */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="bg-black/80 border border-red-500/30 rounded-lg p-6 backdrop-blur-sm">
                <h2
                  className="text-2xl font-bold text-white mb-6 uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  Select Race
                </h2>
                <div className="space-y-3">
                  {races.map((race) => (
                    <motion.button
                      key={race.id}
                      onClick={() => setSelectedRace(race.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-300 ${
                        selectedRace === race.id
                          ? "border-red-500 bg-red-500/20"
                          : "border-red-500/30 bg-black/40 hover:border-red-500/60"
                      }`}
                    >
                      <div className="text-white font-bold text-sm mb-1">{race.name}</div>
                      <div className="text-gray-400 text-xs">{race.date}</div>
                      <div className="text-green-400 text-xs mt-1 uppercase">{race.status}</div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Middle Column - Driver Selection */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="lg:col-span-1"
            >
              <div className="bg-black/80 border border-red-500/30 rounded-lg p-6 backdrop-blur-sm">
                <h2
                  className="text-2xl font-bold text-white mb-6 uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  Select Driver
                </h2>
                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {drivers.map((driver) => (
                    <motion.button
                      key={driver.id}
                      onClick={() => setSelectedDriver(driver.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-300 ${
                        selectedDriver === driver.id
                          ? "border-red-500 bg-red-500/20"
                          : "border-red-500/30 bg-black/40 hover:border-red-500/60"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-white font-bold text-sm mb-1">{driver.name}</div>
                          <div className="text-gray-400 text-xs">{driver.team}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-red-500 font-bold text-lg">${driver.odds.toFixed(2)}</div>
                          <div className="text-gray-400 text-xs">Odds</div>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right Column - Bet Details */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="lg:col-span-1"
            >
              <div className="bg-black/80 border border-red-500/30 rounded-lg p-6 backdrop-blur-sm">
                <h2
                  className="text-2xl font-bold text-white mb-6 uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  Place Bet
                </h2>

                {/* Bet Type Selection */}
                <div className="mb-6">
                  <label className="text-gray-400 text-sm mb-2 block">Bet Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "win", label: "Win" },
                      { value: "podium", label: "Podium" },
                      { value: "fastest-lap", label: "Fastest Lap" },
                    ].map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setBetType(type.value as "win" | "podium" | "fastest-lap")}
                        className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                          betType === type.value
                            ? "border-red-500 bg-red-500/20 text-white"
                            : "border-red-500/30 bg-black/40 text-gray-400 hover:border-red-500/60"
                        }`}
                      >
                        <div className="text-xs font-bold uppercase">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bet Amount */}
                <div className="mb-6">
                  <label className="text-gray-400 text-sm mb-2 block">Bet Amount</label>
                  <input
                    type="number"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full p-3 bg-black/60 border border-red-500/30 rounded-lg text-white placeholder-gray-500 focus:border-red-500 focus:outline-none"
                  />
                </div>

                {/* Potential Winnings */}
                {betAmount && selectedDriver && (
                  <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="text-gray-400 text-xs mb-1">Potential Winnings</div>
                    <div className="text-green-400 font-bold text-2xl">
                      ${(parseFloat(betAmount) * (drivers.find(d => d.id === selectedDriver)?.odds || 1)).toFixed(2)}
                    </div>
                  </div>
                )}

                {/* Place Bet Button */}
                <motion.button
                  onClick={handlePlaceBet}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={!selectedRace || !selectedDriver || !betAmount}
                  className={`w-full p-4 rounded-lg font-bold text-white uppercase tracking-wider transition-all duration-300 ${
                    selectedRace && selectedDriver && betAmount
                      ? "bg-red-600 hover:bg-red-700 border-2 border-red-500"
                      : "bg-gray-700 cursor-not-allowed border-2 border-gray-600"
                  }`}
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  Place Bet
                </motion.button>

                {/* Info */}
                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="text-blue-400 text-xs">
                    <p className="mb-2">ℹ️ Betting Information:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-400">
                      <li>Minimum bet: $10</li>
                      <li>Maximum bet: $10,000</li>
                      <li>Bets are final once placed</li>
                      <li>Winnings paid after race completion</li>
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Active Bets Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="mt-16"
          >
            <div className="bg-black/80 border border-red-500/30 rounded-lg p-6 backdrop-blur-sm">
              <h2
                className="text-2xl font-bold text-white mb-6 uppercase tracking-wider"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                Active Bets
              </h2>
              <div className="text-center text-gray-400 py-8">
                <p>No active bets</p>
                <p className="text-xs mt-2">Place your first bet to see it here</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

