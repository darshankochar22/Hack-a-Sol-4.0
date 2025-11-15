"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import Helmet3D from "./helmet-3d"

export default function DriverTeams() {
  const [selectedDriver, setSelectedDriver] = useState(0)
  const [hoveredDriver, setHoveredDriver] = useState<number | null>(null)

  const drivers = [
    {
      name: "MAX VELOCITY",
      team: "SPEEDFORCE",
      number: 1,
      color: "#FF0000",
      helmetColor: "#FF0000",
      helmetEmoji: "🏁",
      stats: { wins: 24, points: 430, podiums: 32 },
      bio: "World champion with exceptional precision. Multiple championship titles and record-breaking performances.",
    },
    {
      name: "ALEX TURBO",
      team: "GRIDMASTERS",
      number: 11,
      color: "#0066FF",
      helmetColor: "#0066FF",
      helmetEmoji: "⚡",
      stats: { wins: 18, points: 385, podiums: 28 },
      bio: "Rising star known for aggressive overtaking and smooth racecraft. Consistent podium finisher.",
    },
    {
      name: "LUNA NITRO",
      team: "SPEEDFORCE",
      number: 55,
      color: "#FFD700",
      helmetColor: "#FFD700",
      helmetEmoji: "🚀",
      stats: { wins: 12, points: 295, podiums: 22 },
      bio: "Versatile driver excelling in wet conditions. Known for remarkable comebacks and racecraft.",
    },
  ]

  return (
    <section className="min-h-screen bg-gradient-to-b from-background via-grid-dark to-background py-20 px-4 relative overflow-hidden">
      {/* Animated background glow */}
      <motion.div
        animate={{
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-500/20 rounded-full blur-3xl pointer-events-none"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-black text-center mb-16 glow-pulse-text"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          DRIVERS & TEAMS
        </motion.h2>

        {/* Driver carousel */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {drivers.map((driver, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => setSelectedDriver(index)}
              onMouseEnter={() => setHoveredDriver(index)}
              onMouseLeave={() => setHoveredDriver(null)}
              whileHover={{ scale: 1.05, y: -10 }}
              className="cursor-pointer relative"
            >
              <div
                className={`relative p-8 bg-gradient-to-br from-gray-900 to-black rounded-lg border-2 transition-all duration-300 ${
                  selectedDriver === index
                    ? "border-red-500 glow-red-strong"
                    : "border-gray-600/30 hover:border-red-500/50"
                }`}
              >
                {/* 3D Helmet Canvas */}
                <div className="mb-6 h-64 flex items-center justify-center">
                  <Helmet3D
                    color={driver.helmetColor}
                    helmetEmoji={driver.helmetEmoji}
                    isHovered={hoveredDriver === index}
                  />
                </div>

                <div className="text-center">
                  <h3 className="text-2xl font-black text-white mb-1" style={{ fontFamily: "var(--font-orbitron)" }}>
                    {driver.name}
                  </h3>
                  <p className="text-sm text-gray-200 font-bold tracking-widest mb-2">{driver.team}</p>
                  <p className="text-lg text-gray-100 font-black mb-6"># {driver.number}</p>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-6 border-t border-gray-400/30">
                    <div className="text-center">
                      <p className="text-gray-200 text-xs font-bold tracking-widest">WINS</p>
                      <motion.p
                        initial={{ scale: 1 }}
                        whileHover={{ scale: 1.2 }}
                        className="text-white text-xl font-black"
                      >
                        {driver.stats.wins}
                      </motion.p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-200 text-xs font-bold tracking-widest">POINTS</p>
                      <motion.p
                        initial={{ scale: 1 }}
                        whileHover={{ scale: 1.2 }}
                        className="text-white text-xl font-black"
                      >
                        {driver.stats.points}
                      </motion.p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-200 text-xs font-bold tracking-widest">PODIUMS</p>
                      <motion.p
                        initial={{ scale: 1 }}
                        whileHover={{ scale: 1.2 }}
                        className="text-white text-xl font-black"
                      >
                        {driver.stats.podiums}
                      </motion.p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detailed driver info modal */}
        <motion.div
          key={selectedDriver}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-8 bg-gradient-to-r from-black via-gray-900 to-black border-2 border-red-500/50 rounded-lg relative overflow-hidden"
        >
          {/* Animated background accent */}
          <motion.div
            animate={{
              opacity: [0.2, 0.4, 0.2],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
            className="absolute -right-20 -top-20 w-40 h-40 bg-red-500/30 rounded-full blur-2xl"
          />

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-2xl font-black text-red-400 mb-2" style={{ fontFamily: "var(--font-orbitron)" }}>
                  {drivers[selectedDriver].name}
                </h3>
                <p className="text-gray-400 text-sm font-bold tracking-widest">DRIVER PROFILE</p>
              </div>
              <div className="text-5xl">{drivers[selectedDriver].helmetEmoji}</div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-gray-400 text-xs font-bold tracking-widest mb-2">TEAM</p>
                <p className="text-white text-lg font-black">{drivers[selectedDriver].team}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold tracking-widest mb-2">CAR NUMBER</p>
                <p className="text-white text-lg font-black">#{drivers[selectedDriver].number}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs font-bold tracking-widest mb-2">CHAMPIONSHIP POINTS</p>
                <p className="text-red-400 text-lg font-black">{drivers[selectedDriver].stats.points}</p>
              </div>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">{drivers[selectedDriver].bio}</p>
          </div>
        </motion.div>

        {/* Team standings */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-12 p-8 bg-black border-2 border-red-500/50 rounded-lg"
        >
          <p className="text-red-400 font-black tracking-widest text-sm mb-6">TEAM STANDINGS</p>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-white font-bold">SPEEDFORCE</p>
              <p className="text-red-400 font-black">725 POINTS</p>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "100%" }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-red-500 to-red-600"
              />
            </div>
            <div className="flex justify-between items-center mt-4">
              <p className="text-white font-bold">GRIDMASTERS</p>
              <p className="text-red-400 font-black">385 POINTS</p>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "52%" }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
