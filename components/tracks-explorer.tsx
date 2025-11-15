"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import InteractiveMap from "./interactive-map"

export default function TracksExplorer() {
  const [selectedTrack, setSelectedTrack] = useState(0)

  const tracks = [
    {
      id: 0,
      name: "MONZA",
      country: "ITALY",
      length: "5.793 KM",
      turns: 11,
      temp: "22°C",
      x: 250,
      y: 120,
      record: "1:19.307",
      description: "The ultimate high-speed circuit, famous for its long straights and chicanes.",
    },
    {
      id: 1,
      name: "SILVERSTONE",
      country: "UK",
      length: "5.891 KM",
      turns: 18,
      temp: "18°C",
      x: 180,
      y: 80,
      record: "1:22.519",
      description: "Iconic British circuit known for high-speed corners and racing heritage.",
    },
    {
      id: 2,
      name: "MONACO",
      country: "MONACO",
      length: "3.337 KM",
      turns: 19,
      temp: "24°C",
      x: 240,
      y: 140,
      record: "1:12.600",
      description: "The most prestigious race, featuring tight corners and precision driving.",
    },
    {
      id: 3,
      name: "SPA",
      country: "BELGIUM",
      length: "7.004 KM",
      turns: 20,
      temp: "16°C",
      x: 210,
      y: 100,
      record: "1:41.252",
      description: "Famous for its Eau Rouge corner and unpredictable weather conditions.",
    },
  ]

  const trackPins = tracks.map((track) => ({
    id: track.id,
    name: track.name,
    x: track.x,
    y: track.y,
    country: track.country,
  }))

  return (
    <section className="min-h-screen bg-background py-20 px-4 relative overflow-hidden">
      {/* Background glow */}
      <motion.div
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-500/20 rounded-full blur-3xl pointer-events-none"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-black text-center mb-16 glow-pulse-text"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          TRACKS EXPLORER
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Interactive Map */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="md:col-span-2 h-96"
          >
            <InteractiveMap pins={trackPins} selectedPin={selectedTrack} onSelectPin={setSelectedTrack} />
          </motion.div>

          {/* Track List Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-4"
          >
            {tracks.map((track, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => setSelectedTrack(index)}
                className={`p-4 rounded-lg cursor-pointer border-2 transition-all duration-300 ${
                  selectedTrack === index
                    ? "border-red-500 bg-gradient-to-r from-red-900/30 to-black glow-red-strong"
                    : "border-gray-600/30 bg-gradient-to-r from-gray-900 to-black hover:border-red-500/50"
                }`}
                whileHover={{ x: 5 }}
              >
                <h3 className="text-lg font-black text-red-400 mb-1" style={{ fontFamily: "var(--font-orbitron)" }}>
                  {track.name}
                </h3>
                <p className="text-gray-400 text-xs font-bold tracking-widest">{track.country}</p>
                <div className="grid grid-cols-3 gap-1 mt-2 text-xs">
                  <div>
                    <p className="text-gray-500">LENGTH</p>
                    <p className="text-white font-black">{track.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">TURNS</p>
                    <p className="text-white font-black">{track.turns}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">TEMP</p>
                    <p className="text-white font-black">{track.temp}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Track Details */}
        <motion.div
          key={selectedTrack}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-12 grid md:grid-cols-2 gap-8"
        >
          {/* Track visualization */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative h-80 bg-gradient-to-br from-gray-900 to-black rounded-lg border-2 border-red-500/30 glow-red flex items-center justify-center overflow-hidden group"
          >
            {/* Animated track outline */}
            <motion.svg
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="absolute w-3/4 h-3/4"
              viewBox="0 0 200 200"
            >
              <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(255, 0, 0, 0.3)" strokeWidth="2" />
              <path
                d="M 100 20 Q 180 50 180 100 Q 180 180 100 180 Q 20 180 20 100 Q 20 50 100 20"
                fill="none"
                stroke="rgba(255, 0, 0, 0.5)"
                strokeWidth="3"
              />
            </motion.svg>

            <div className="text-center relative z-10">
              <div className="text-6xl mb-4">🏁</div>
              <p className="text-red-400 font-black text-lg">{tracks[selectedTrack].name}</p>
              <p className="text-gray-400 text-sm mt-2">Circuit Layout</p>
            </div>
          </motion.div>

          {/* Track info panel */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="p-6 bg-gradient-to-br from-gray-900 to-black border-2 border-red-500/30 rounded-lg glow-red">
              <p className="text-red-400 font-black tracking-widest text-sm mb-4">TRACK INFORMATION</p>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-xs font-bold tracking-widest mb-1">CIRCUIT LENGTH</p>
                  <p className="text-white text-lg font-black">{tracks[selectedTrack].length}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-bold tracking-widest mb-1">NUMBER OF TURNS</p>
                  <p className="text-white text-lg font-black">{tracks[selectedTrack].turns}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-bold tracking-widest mb-1">LAP RECORD</p>
                  <p className="text-red-400 text-lg font-black">{tracks[selectedTrack].record}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs font-bold tracking-widest mb-1">AMBIENT TEMP</p>
                  <p className="text-white text-lg font-black">{tracks[selectedTrack].temp}</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-black border-2 border-red-500/50 rounded-lg">
              <p className="text-gray-300 text-sm leading-relaxed">{tracks[selectedTrack].description}</p>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
