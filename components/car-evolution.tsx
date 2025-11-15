"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

export default function CarEvolution() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const morphProgress = useTransform(scrollYProgress, [0, 1], [0, 1])

  const eras = [
    { year: 1950, name: "CLASSIC ERA", color: "#8B4513" },
    { year: 1980, name: "TURBO ERA", color: "#FF6B35" },
    { year: 2000, name: "HYBRID ERA", color: "#004E89" },
    { year: 2025, name: "FUTURE ERA", color: "#FF0000" },
  ]

  return (
    <section ref={containerRef} className="min-h-screen bg-gradient-to-b from-background to-grid-dark py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-black text-center mb-16 glow-pulse-text"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          F1 CAR EVOLUTION
        </motion.h2>

        <div className="grid md:grid-cols-4 gap-6 mb-12">
          {eras.map((era, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="relative p-8 rounded-lg border-2 border-gray-600/50 bg-gradient-to-b from-gray-900 to-black text-center group cursor-pointer"
            >
              <motion.div whileHover={{ scale: 1.2 }} className="text-5xl mb-4">
                🏎️
              </motion.div>
              <h3 className="text-2xl font-black mb-2" style={{ fontFamily: "var(--font-orbitron)", color: era.color }}>
                {era.year}
              </h3>
              <p className="text-gray-300 text-sm font-bold tracking-widest">{era.name}</p>

              {/* Hover gradient effect */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 rounded-lg border-2 border-red-500 glow-red-strong pointer-events-none"
              />
            </motion.div>
          ))}
        </div>

        {/* Evolution timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="p-8 bg-black border-2 border-red-500/50 rounded-lg"
        >
          <p className="text-red-400 font-black tracking-widest text-sm mb-4">TIMELINE PROGRESSION</p>
          <motion.div className="h-2 bg-gradient-to-r from-red-900 via-red-500 to-red-900 rounded-full overflow-hidden">
            <motion.div
              style={{ scaleX: morphProgress, transformOrigin: "left" }}
              className="h-full bg-gradient-to-r from-yellow-400 via-red-400 to-red-500"
            />
          </motion.div>
          <p className="text-gray-300 text-sm mt-4 leading-relaxed">
            From the iconic roadsters of 1950 through the turbo-charged powerhouses of the 1980s, the hybrid revolution
            of the 2000s, to today's cutting-edge electric-hybrid fusion vehicles.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
