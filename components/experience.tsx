"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"

export default function Experience() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const yOffset = useTransform(scrollYProgress, [0, 1], [50, -50])

  const experiences = [
    {
      title: "RACE SIMULATION",
      description: "Navigate a 3D track in real-time with responsive controls and dynamic camera work.",
      icon: "🎮",
      color: "from-purple-600 to-purple-900",
    },
    {
      title: "CAR EVOLUTION",
      description: "Watch the transformation of F1 cars from 1950 to 2025 with synchronized animations.",
      icon: "⚡",
      color: "from-blue-600 to-blue-900",
    },
    {
      title: "DRIVER PROFILES",
      description: "Explore detailed driver stats, achievements, and career highlights interactively.",
      icon: "👤",
      color: "from-yellow-600 to-yellow-900",
    },
    {
      title: "LIVE TRACKING",
      description: "Real-time race telemetry, GPS tracking, and performance metrics visualization.",
      icon: "📊",
      color: "from-green-600 to-green-900",
    },
  ]

  return (
    <section ref={containerRef} className="min-h-screen bg-background py-20 px-4 relative overflow-hidden">
      {/* Ambient glow */}
      <motion.div style={{ y: yOffset }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-red-500/10 rounded-full blur-3xl" />
      </motion.div>

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-black text-center mb-16 glow-pulse-text"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          THE EXPERIENCE
        </motion.h2>

        <div className="grid md:grid-cols-2 gap-8">
          {experiences.map((exp, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.12 }}
              whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(255, 0, 0, 0.3)" }}
              className={`p-8 bg-gradient-to-br ${exp.color} border border-red-500/30 rounded-lg glow-red hover:glow-red-strong transition-all duration-300 cursor-pointer relative overflow-hidden group`}
            >
              {/* Hover effect background */}
              <motion.div
                initial={{ opacity: 0 }}
                whileHover={{ opacity: 1 }}
                className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent"
              />

              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 1 }}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  transition={{ duration: 0.3 }}
                  className="text-4xl mb-4 inline-block"
                >
                  {exp.icon}
                </motion.div>
                <h3 className="text-xl font-black mb-4 text-white" style={{ fontFamily: "var(--font-orbitron)" }}>
                  {exp.title}
                </h3>
                <p className="text-gray-200 text-sm leading-relaxed">{exp.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
