"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import RadialGauge from "./radial-gauge"

export default function TelemetryDashboard() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const [metrics, setMetrics] = useState([
    { label: "RPM", value: 8500, max: 16000, unit: "RPM", color: "#FF6B35" },
    { label: "SPEED", value: 240, max: 370, unit: "KM/H", color: "#004E89" },
    { label: "TIRE TEMP", value: 95, max: 120, unit: "°C", color: "#FFD700" },
    { label: "G-FORCE", value: 3.8, max: 5.0, unit: "G", color: "#00FF88" },
  ])

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) =>
        prev
          .map((m) => ({
            ...m,
            value: Math.max(0, m.value + (Math.random() - 0.5) * 20),
          }))
          .map((m, i) => ({
            ...m,
            value: Math.min(m.max * 0.95, m.value),
          })),
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const driverComparison = [
    { name: "MAX VELOCITY", data: [450, 320, 420, 380], color: "#FF0000" },
    { name: "ALEX TURBO", data: [420, 310, 390, 360], color: "#0066FF" },
  ]

  const yOffset = useTransform(scrollYProgress, [0, 1], [50, -50])

  return (
    <section
      ref={containerRef}
      className="min-h-screen bg-gradient-to-b from-background via-grid-dark to-background py-20 px-4 relative overflow-hidden"
    >
      {/* Animated scanlines effect */}
      <motion.div
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(0deg, transparent 24%, rgba(255, 0, 0, 0.05) 25%, rgba(255, 0, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 0, 0, 0.05) 75%, rgba(255, 0, 0, 0.05) 76%, transparent 77%, transparent)",
          backgroundSize: "100% 50px",
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-black text-center mb-4 glow-pulse-text"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          LIVE TELEMETRY
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center text-gray-400 text-sm tracking-widest mb-16"
        >
          REAL-TIME VEHICLE PERFORMANCE DATA
        </motion.p>

        {/* Radial gauges */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="p-6 bg-gradient-to-br from-gray-900 to-black border-2 border-red-500/30 rounded-lg glow-red text-center"
            >
              <RadialGauge
                label={metric.label}
                value={Math.round(metric.value)}
                max={metric.max}
                unit={metric.unit}
                color={metric.color}
              />
              <p className="text-gray-400 text-xs font-bold tracking-widest mt-4">{metric.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Tire telemetry */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16 p-8 bg-gradient-to-br from-gray-900 to-black border-2 border-red-500/30 rounded-lg glow-red"
        >
          <p className="text-red-400 font-black tracking-widest text-sm mb-6">TIRE TEMPERATURES</p>

          <div className="grid md:grid-cols-4 gap-4">
            {[
              { corner: "FRONT LEFT", temp: 92, color: "#FFD700" },
              { corner: "FRONT RIGHT", temp: 88, color: "#FF6B35" },
              { corner: "REAR LEFT", temp: 98, color: "#FF0000" },
              { corner: "REAR RIGHT", temp: 95, color: "#FF4444" },
            ].map((tire, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0.9 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="relative"
              >
                <div className="text-center">
                  <div className="text-4xl mb-2">🛞</div>
                  <p className="text-gray-400 text-xs font-bold tracking-widest mb-2">{tire.corner}</p>

                  {/* Circular temp display */}
                  <div className="relative w-16 h-16 mx-auto rounded-full border-4 border-gray-700 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center overflow-hidden">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                      className="w-full h-full rounded-full flex items-center justify-center"
                      style={{
                        background: `conic-gradient(${tire.color} 0%, ${tire.color} ${(tire.temp / 120) * 100}%, rgba(255,0,0,0.1) ${(tire.temp / 120) * 100}%, rgba(255,0,0,0.1) 100%)`,
                      }}
                    >
                      <div className="bg-black rounded-full w-12 h-12 flex items-center justify-center">
                        <p className="text-white font-black text-sm">{tire.temp}°</p>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Driver comparison chart */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="p-8 bg-black border-2 border-red-500/50 rounded-lg relative overflow-hidden"
        >
          <p className="text-red-400 font-black tracking-widest text-sm mb-8">DRIVER COMPARISON</p>

          {/* Simple bar chart */}
          <div className="space-y-6">
            {driverComparison.map((driver, idx) => (
              <div key={idx}>
                <div className="flex justify-between items-center mb-2">
                  <p className="text-white font-black text-sm">{driver.name}</p>
                  <p className="text-gray-400 text-xs">Performance Score</p>
                </div>

                <div className="flex gap-2">
                  {driver.data.map((value, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${(value / 450) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className="flex-1 min-h-8 rounded-sm relative group cursor-pointer"
                      style={{ backgroundColor: driver.color, opacity: 0.6 }}
                      whileHover={{
                        opacity: 1,
                        boxShadow: `0 0 20px ${driver.color}`,
                      }}
                    >
                      <motion.div
                        className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ color: driver.color }}
                      >
                        {value}
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-6 mt-8 justify-center text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#FF0000" }} />
              <span className="text-gray-400">MAX VELOCITY</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "#0066FF" }} />
              <span className="text-gray-400">ALEX TURBO</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
