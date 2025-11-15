"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef, useState, useEffect } from "react"

export default function Leaderboard() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const [leaderboard, setLeaderboard] = useState([
    { rank: 1, name: "MAX VELOCITY", points: 430, team: "SPEEDFORCE", badge: "👑", trend: "↑" },
    { rank: 2, name: "ALEX TURBO", points: 385, team: "GRIDMASTERS", badge: "🥈", trend: "↓" },
    { rank: 3, name: "LUNA NITRO", points: 295, team: "SPEEDFORCE", badge: "🥉", trend: "↑" },
    { rank: 4, name: "GRID CHAMPION", points: 245, team: "ELITE RACING", badge: "⭐", trend: "=" },
  ])

  const [fanZoneActive, setFanZoneActive] = useState(false)
  const yOffset = useTransform(scrollYProgress, [0, 1], [50, -50])

  useEffect(() => {
    const interval = setInterval(() => {
      setLeaderboard((prev) =>
        prev
          .map((entry) => ({
            ...entry,
            points: entry.points + Math.floor(Math.random() * 10),
          }))
          .sort((a, b) => b.points - a.points)
          .map((entry, idx) => ({
            ...entry,
            rank: idx + 1,
            trend: Math.random() > 0.5 ? "↑" : Math.random() > 0.5 ? "↓" : "=",
          })),
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <section
      ref={containerRef}
      className="min-h-screen bg-gradient-to-b from-background via-grid-dark to-background py-20 px-4 relative overflow-hidden"
    >
      {/* Ambient effects */}
      <motion.div style={{ y: yOffset }} className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-1/3 -left-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -right-32 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
      </motion.div>

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-black text-center mb-4 glow-pulse-text"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          CHAMPIONSHIP LEADERBOARD
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center text-gray-400 text-sm tracking-widest mb-12"
        >
          LIVE STANDINGS UPDATING IN REAL-TIME
        </motion.p>

        {/* Main leaderboard */}
        <div className="space-y-3 mb-12">
          {leaderboard.map((entry, index) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ scale: 1.02, x: 10, boxShadow: "0 20px 40px rgba(255, 0, 0, 0.3)" }}
              className="p-6 bg-gradient-to-r from-gray-900 to-black border-2 border-red-500/30 rounded-lg glow-red hover:glow-red-strong transition-all duration-300 flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-6 flex-1">
                {/* Rank badge */}
                <motion.div
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  className="text-3xl w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-900 flex-shrink-0"
                >
                  {entry.badge}
                </motion.div>

                <div>
                  <p className="text-white text-lg font-black" style={{ fontFamily: "var(--font-orbitron)" }}>
                    #{entry.rank} - {entry.name}
                    <span
                      className={`ml-3 font-black text-sm ${entry.trend === "↑" ? "text-green-400" : entry.trend === "↓" ? "text-red-400" : "text-gray-400"}`}
                    >
                      {entry.trend}
                    </span>
                  </p>
                  <p className="text-gray-400 text-sm font-bold">{entry.team}</p>
                </div>
              </div>

              {/* Points display */}
              <div className="text-right flex-shrink-0">
                <motion.p
                  key={entry.points}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-red-400 font-black text-2xl"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  {entry.points}
                </motion.p>
                <p className="text-gray-500 text-xs">POINTS</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Fan Zone section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="p-8 bg-gradient-to-br from-black via-gray-900 to-black border-2 border-red-500/50 rounded-lg relative overflow-hidden"
        >
          {/* Animated border effect */}
          <motion.div
            animate={{
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            className="absolute -inset-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500 rounded-lg opacity-0 blur group-hover:opacity-100 transition duration-1000 -z-10"
          />

          <div className="relative z-10">
            <p className="text-red-400 font-black tracking-widest text-sm mb-6">FAN ZONE & GAMIFICATION</p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-4 bg-black border border-red-500/30 rounded-lg text-center cursor-pointer group hover:border-red-500 transition-colors"
              >
                <p className="text-2xl mb-2">🎮</p>
                <p className="text-white font-black text-sm mb-2">TRIVIA CHALLENGE</p>
                <p className="text-gray-400 text-xs">Test your F1 knowledge</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-4 bg-black border border-red-500/30 rounded-lg text-center cursor-pointer group hover:border-red-500 transition-colors"
              >
                <p className="text-2xl mb-2">📊</p>
                <p className="text-white font-black text-sm mb-2">PREDICTIONS</p>
                <p className="text-gray-400 text-xs">Predict race outcomes</p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-4 bg-black border border-red-500/30 rounded-lg text-center cursor-pointer group hover:border-red-500 transition-colors"
              >
                <p className="text-2xl mb-2">⏱️</p>
                <p className="text-white font-black text-sm mb-2">TIME TRIALS</p>
                <p className="text-gray-400 text-xs">Compete globally</p>
              </motion.div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFanZoneActive(!fanZoneActive)}
              className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-black rounded-sm border-2 border-red-500 glow-red-strong hover:from-red-700 hover:to-red-800 transition-all duration-300 tracking-widest text-sm"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              {fanZoneActive ? "🎪 FAN ZONE ACTIVE" : "🎪 ENTER FAN ZONE"}
            </motion.button>

            {fanZoneActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg"
              >
                <p className="text-gray-300 text-sm leading-relaxed">
                  Welcome to the Fan Zone! Earn points through trivia challenges, race predictions, and time trials.
                  Climb the rankings and unlock exclusive rewards and driver experiences.
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
