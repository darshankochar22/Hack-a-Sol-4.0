"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"

export default function AboutMachine() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const rotate = useTransform(scrollYProgress, [0, 1], [0, 360])
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1, 0.8])
  const y = useTransform(scrollYProgress, [0, 1], [100, -100])

  const specs = [
    { label: "MAX SPEED", value: "370 KM/H" },
    { label: "ACCELERATION", value: "0-100 in 2.6s" },
    { label: "HORSEPOWER", value: "1050 HP" },
    { label: "TORQUE", value: "900 N·m" },
    { label: "TEAM", value: "THE GRID" },
    { label: "SEASON", value: "2025" },
  ]

  return (
    <section
      ref={containerRef}
      className="min-h-screen bg-gradient-to-b from-background via-grid-dark to-background py-20 px-4 relative overflow-hidden"
    >
      {/* Animated background elements */}
      <motion.div style={{ y, opacity: scrollYProgress }} className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/20 rounded-full blur-3xl" />
      </motion.div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-black text-center mb-16 glow-pulse-text"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          ABOUT THE MACHINE
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: 3D Car with rotation */}
          <motion.div
            style={{ rotate, scale }}
            className="relative h-96 md:h-full bg-gradient-to-br from-gray-900 to-black rounded-lg border-2 border-red-500/30 glow-red flex items-center justify-center overflow-hidden"
          >
            {/* Orbital animation */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="absolute inset-0 border border-red-500/20 rounded-full"
              style={{ width: "80%", height: "80%", margin: "auto" }}
            />

            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="relative"
            >
              <div className="text-8xl">🏎️</div>
            </motion.div>

            <div className="absolute bottom-4 left-4 right-4 text-center">
              <p className="text-red-400 text-xs font-bold tracking-widest">3D CAR MODEL</p>
              <p className="text-gray-600 text-xs">(Three.js Integration)</p>
            </div>
          </motion.div>

          {/* Right: Specs Grid with staggered animations */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              {specs.map((spec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.08 }}
                  whileHover={{ scale: 1.05, borderColor: "rgba(255, 0, 0, 0.8)" }}
                  className="p-4 bg-gradient-to-br from-gray-900 to-black border border-red-500/20 rounded-sm glow-red hover:glow-red-strong transition-all duration-300 cursor-pointer"
                >
                  <p className="text-red-400 text-xs font-bold tracking-widest mb-2">{spec.label}</p>
                  <p className="text-white text-lg font-black" style={{ fontFamily: "var(--font-orbitron)" }}>
                    {spec.value}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Animated HUD panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ scale: 1.02 }}
              className="p-6 bg-black border-2 border-red-500/50 rounded-sm mt-8 relative overflow-hidden"
            >
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
                className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl"
              />
              <p className="text-red-400 text-xs font-bold tracking-widest mb-2 relative z-10">TELEMETRY</p>
              <p className="text-gray-300 leading-relaxed text-sm relative z-10">
                The ultimate racing machine engineered for speed, precision, and dominance on the track. Every component
                optimized for peak performance.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
