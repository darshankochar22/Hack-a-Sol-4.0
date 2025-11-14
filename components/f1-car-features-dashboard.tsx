"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import Image from "next/image"
import RadialGauge from "./radial-gauge"
import { FocusCards } from "@/components/ui/focus-cards"
import { CometCard } from "@/components/ui/comet-card"
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect"
import car1 from "../assets/car1.jpg"
import car2 from "../assets/car2.jpg"
import car3 from "../assets/car3.jpg"
import car4 from "../assets/car4.jpg"

export default function F1CarFeaturesDashboard() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  // Performance metrics
  const [performanceMetrics, setPerformanceMetrics] = useState([
    { label: "TOP SPEED", value: 352, max: 380, unit: "KM/H", color: "#FF0000" },
    { label: "POWER", value: 1050, max: 1100, unit: "HP", color: "#FF6B35" },
    { label: "DOWNFORCE", value: 850, max: 1000, unit: "KG", color: "#00FF88" },
    { label: "EFFICIENCY", value: 92, max: 100, unit: "%", color: "#0066FF" },
  ])

  // Tire data
  const [tireData, setTireData] = useState([
    { corner: "FL", temp: 95, pressure: 21.5, wear: 15 },
    { corner: "FR", temp: 92, pressure: 21.8, wear: 18 },
    { corner: "RL", temp: 98, pressure: 20.5, wear: 22 },
    { corner: "RR", temp: 96, pressure: 20.8, wear: 20 },
  ])

  // Aerodynamic data for heatmap
  const aeroHeatmap = [
    [85, 90, 95, 100, 98, 92, 88],
    [80, 88, 94, 100, 98, 95, 90],
    [75, 85, 92, 98, 96, 93, 88],
    [70, 82, 90, 95, 94, 90, 85],
    [68, 80, 88, 93, 91, 88, 82],
  ]

  // Speed chart data
  const speedData = [
    { lap: 1, speed: 285 },
    { lap: 2, speed: 290 },
    { lap: 3, speed: 295 },
    { lap: 4, speed: 300 },
    { lap: 5, speed: 295 },
    { lap: 6, speed: 305 },
    { lap: 7, speed: 310 },
    { lap: 8, speed: 315 },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setPerformanceMetrics((prev) =>
        prev.map((m) => ({
          ...m,
          value: Math.max(0, m.value + (Math.random() - 0.5) * (m.max * 0.05)),
        })).map((m) => ({
          ...m,
          value: Math.min(m.max * 0.98, Math.max(m.max * 0.7, m.value)),
        })),
      )

      setTireData((prev) =>
        prev.map((t) => ({
          ...t,
          temp: Math.max(85, Math.min(105, t.temp + (Math.random() - 0.5) * 5)),
          pressure: Math.max(20, Math.min(22.5, t.pressure + (Math.random() - 0.5) * 0.3)),
        })),
      )
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  const yOffset = useTransform(scrollYProgress, [0, 1], [50, -50])

  // Car metrics data based on OpenF1 API structure
  const carMetrics = {
    "Mercedes-AMG F1 W15": {
      speed: { value: 352, max: 380, unit: "km/h" },
      rpm: { value: 12500, max: 15000, unit: "RPM" },
      throttle: { value: 87, max: 100, unit: "%" },
      brake: { value: 12, max: 100, unit: "%" },
      gear: 8,
      drs: true,
      enginePower: { value: 1050, max: 1100, unit: "HP" },
      downforce: { value: 850, max: 1000, unit: "KG" },
      fuelLevel: { value: 65, max: 100, unit: "%" },
      tireTempFL: 95,
      tireTempFR: 92,
      tireTempRL: 98,
      tireTempRR: 96,
      tirePressureFL: 21.5,
      tirePressureFR: 21.8,
      tirePressureRL: 20.5,
      tirePressureRR: 20.8,
      lapTime: "1:23.456",
      sector1: "28.123",
      sector2: "35.234",
      sector3: "20.099",
    },
    "Oracle Red Bull Racing RB20": {
      speed: { value: 368, max: 385, unit: "km/h" },
      rpm: { value: 13200, max: 15000, unit: "RPM" },
      throttle: { value: 92, max: 100, unit: "%" },
      brake: { value: 8, max: 100, unit: "%" },
      gear: 8,
      drs: true,
      enginePower: { value: 1080, max: 1100, unit: "HP" },
      downforce: { value: 890, max: 1000, unit: "KG" },
      fuelLevel: { value: 72, max: 100, unit: "%" },
      tireTempFL: 98,
      tireTempFR: 96,
      tireTempRL: 100,
      tireTempRR: 99,
      tirePressureFL: 21.8,
      tirePressureFR: 22.0,
      tirePressureRL: 20.8,
      tirePressureRR: 21.0,
      lapTime: "1:22.987",
      sector1: "27.890",
      sector2: "34.567",
      sector3: "20.530",
    },
    "Scuderia Ferrari SF-24": {
      speed: { value: 360, max: 382, unit: "km/h" },
      rpm: { value: 12800, max: 15000, unit: "RPM" },
      throttle: { value: 89, max: 100, unit: "%" },
      brake: { value: 10, max: 100, unit: "%" },
      gear: 8,
      drs: true,
      enginePower: { value: 1065, max: 1100, unit: "HP" },
      downforce: { value: 870, max: 1000, unit: "KG" },
      fuelLevel: { value: 68, max: 100, unit: "%" },
      tireTempFL: 94,
      tireTempFR: 91,
      tireTempRL: 97,
      tireTempRR: 95,
      tirePressureFL: 21.6,
      tirePressureFR: 21.9,
      tirePressureRL: 20.6,
      tirePressureRR: 20.9,
      lapTime: "1:23.234",
      sector1: "28.234",
      sector2: "35.123",
      sector3: "19.877",
    },
    "McLaren F1 Team MCL38": {
      speed: { value: 355, max: 378, unit: "km/h" },
      rpm: { value: 12600, max: 15000, unit: "RPM" },
      throttle: { value: 85, max: 100, unit: "%" },
      brake: { value: 14, max: 100, unit: "%" },
      gear: 8,
      drs: false,
      enginePower: { value: 1045, max: 1100, unit: "HP" },
      downforce: { value: 860, max: 1000, unit: "KG" },
      fuelLevel: { value: 61, max: 100, unit: "%" },
      tireTempFL: 93,
      tireTempFR: 90,
      tireTempRL: 96,
      tireTempRR: 94,
      tirePressureFL: 21.4,
      tirePressureFR: 21.7,
      tirePressureRL: 20.4,
      tirePressureRR: 20.7,
      lapTime: "1:23.789",
      sector1: "28.456",
      sector2: "35.345",
      sector3: "19.988",
    },
  }

  // Car cards data with real F1 car names
  const carCards = [
    { title: "Mercedes-AMG F1 W15", src: (car1 as { src: string }).src || String(car1) },
    { title: "Oracle Red Bull Racing RB20", src: (car2 as { src: string }).src || String(car2) },
    { title: "Scuderia Ferrari SF-24", src: (car3 as { src: string }).src || String(car3) },
    { title: "McLaren F1 Team MCL38", src: (car4 as { src: string }).src || String(car4) },
  ]

  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null)

  const getHeatmapColor = (value: number, max: number) => {
    const ratio = value / max
    if (ratio > 0.9) return "bg-red-600"
    if (ratio > 0.7) return "bg-orange-500"
    if (ratio > 0.5) return "bg-yellow-500"
    if (ratio > 0.3) return "bg-green-500"
    return "bg-blue-500"
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-background text-foreground py-20 px-4 relative overflow-hidden"
    >
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dashboard-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ff0000" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dashboard-grid)" />
        </svg>
      </div>

      {/* Animated scanlines effect */}
      <motion.div
        animate={{ opacity: [0.1, 0.3, 0.1] }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(0deg, transparent 24%, rgba(255, 0, 0, 0.05) 25%, rgba(255, 0, 0, 0.05) 26%, transparent 27%, transparent 74%, rgba(255, 0, 0, 0.05) 75%, rgba(255, 0, 0, 0.05) 76%, transparent 77%, transparent)",
          backgroundSize: "100% 50px",
        }}
      />

      {/* Background Ripple Effect - Full Width at Top of Screen */}
      <div className="fixed left-0 right-0 top-0 overflow-visible pointer-events-none" style={{ height: '500px', zIndex: 1 }}>
        <div className="w-full h-full relative pointer-events-auto">
          <BackgroundRippleEffect 
            rows={10} 
            cols={60} 
            cellSize={40}
            borderColor="rgba(255, 0, 0, 0.6)"
            fillColor="rgba(0, 0, 0, 0.8)"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 relative pt-64"
        >
          <h1
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-4 relative z-10"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            F1 CAR DASHBOARD
          </h1>
          <div className="w-32 h-1 bg-red-600 mx-auto mb-4 relative z-10"></div>
          <p className="text-gray-400 text-sm tracking-widest uppercase relative z-10">
            Performance Analytics & Telemetry
          </p>
        </motion.div>

        {/* Car Focus Cards */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16 relative"
        >
          <div className="max-w-7xl mx-auto">
            <FocusCards 
              cards={carCards} 
              columns={4} 
              onCardHover={setHoveredCardIndex}
            />
          </div>
          
          {/* Hover Metrics Card */}
          <AnimatePresence>
            {hoveredCardIndex !== null && carCards[hoveredCardIndex] && (carMetrics as Record<string, CarMetrics>)[carCards[hoveredCardIndex].title] && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ duration: 0.3 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-8 z-50 w-full max-w-2xl px-4"
              >
                <CometCard>
                  <CarMetricsCard 
                    carName={carCards[hoveredCardIndex].title}
                    metrics={(carMetrics as Record<string, CarMetrics>)[carCards[hoveredCardIndex].title]}
                  />
                </CometCard>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Performance Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <h2
            className="text-2xl md:text-3xl font-bold text-white mb-8 uppercase tracking-wider"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            Performance Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceMetrics.map((metric, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="p-6 bg-black/80 border border-red-500/30 rounded-lg backdrop-blur-sm hover:border-red-500/60 transition-all duration-300"
              >
                <RadialGauge
                  label={metric.label}
                  value={Math.round(metric.value)}
                  max={metric.max}
                  unit={metric.unit}
                  color={metric.color}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Aerodynamic Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-16 p-8 bg-black/80 border border-red-500/30 rounded-lg backdrop-blur-sm"
        >
          <h2
            className="text-2xl md:text-3xl font-bold text-white mb-6 uppercase tracking-wider"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            Aerodynamic Pressure Heatmap
          </h2>
          <div className="flex flex-col gap-2">
            {aeroHeatmap.map((row, rowIndex) => (
              <div key={rowIndex} className="flex gap-2 justify-center">
                {row.map((value, colIndex) => (
                  <motion.div
                    key={colIndex}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (rowIndex + colIndex) * 0.05 }}
                    className={`w-16 h-16 ${getHeatmapColor(value, 100)} rounded-sm border border-black/50 flex items-center justify-center text-white font-bold text-xs`}
                  >
                    {value}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 mt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span className="text-gray-400 text-xs">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-gray-400 text-xs">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="text-gray-400 text-xs">High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-gray-400 text-xs">Very High</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-600 rounded"></div>
              <span className="text-gray-400 text-xs">Critical</span>
            </div>
          </div>
        </motion.div>

        {/* Speed Graph */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-16 p-8 bg-black/80 border border-red-500/30 rounded-lg backdrop-blur-sm"
        >
          <h2
            className="text-2xl md:text-3xl font-bold text-white mb-6 uppercase tracking-wider"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            Speed Profile
          </h2>
          <div className="relative h-64 flex items-end justify-between gap-2">
            {speedData.map((data, index) => (
              <motion.div
                key={index}
                initial={{ height: 0 }}
                whileInView={{ height: `${(data.speed / 350) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className="flex-1 bg-gradient-to-t from-red-600 to-red-400 rounded-t-sm border border-red-500/50 relative group"
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  {data.speed} km/h
                </div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-gray-400 text-xs">
                  L{data.lap}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Tire Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-16 p-8 bg-black/80 border border-red-500/30 rounded-lg backdrop-blur-sm"
        >
          <h2
            className="text-2xl md:text-3xl font-bold text-white mb-6 uppercase tracking-wider"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            Tire Analysis
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tireData.map((tire, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="p-6 bg-black/60 border border-red-500/30 rounded-lg"
              >
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">🛞</div>
                  <p className="text-white font-bold text-lg mb-4">{tire.corner}</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400 text-xs">Temperature</span>
                      <span className="text-red-500 font-bold text-sm">{tire.temp}°C</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${(tire.temp / 120) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="bg-gradient-to-r from-yellow-500 to-red-600 h-2 rounded-full"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400 text-xs">Pressure</span>
                      <span className="text-green-500 font-bold text-sm">{tire.pressure} PSI</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${((tire.pressure - 20) / 3) * 100}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-400 text-xs">Wear</span>
                      <span className="text-orange-500 font-bold text-sm">{tire.wear}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${tire.wear}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="bg-gradient-to-r from-green-500 to-orange-500 h-2 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Back Button */}
        <motion.button
          onClick={() => router.back()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-8 left-8 z-30 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-sm border-2 border-red-500 uppercase tracking-widest transition-all duration-300 shadow-lg"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          Back
        </motion.button>
      </div>
    </div>
  )
}

// Car Metrics Card Component
type CarMetrics = {
  speed: { value: number; max: number; unit: string }
  rpm: { value: number; max: number; unit: string }
  throttle: { value: number; max: number; unit: string }
  brake: { value: number; max: number; unit: string }
  gear: number
  drs: boolean
  enginePower: { value: number; max: number; unit: string }
  downforce: { value: number; max: number; unit: string }
  fuelLevel: { value: number; max: number; unit: string }
  tireTempFL: number
  tireTempFR: number
  tireTempRL: number
  tireTempRR: number
  tirePressureFL: number
  tirePressureFR: number
  tirePressureRL: number
  tirePressureRR: number
  lapTime: string
  sector1: string
  sector2: string
  sector3: string
}

function CarMetricsCard({ 
  carName, 
  metrics 
}: { 
  carName: string
  metrics: CarMetrics
}) {
  return (
    <div className="bg-black/90 border border-red-500/30 rounded-2xl p-6 backdrop-blur-sm">
      {/* Header */}
      <div className="mb-6">
        <div className="w-16 h-1 bg-red-600 mb-3"></div>
        <h3
          className="text-2xl font-bold text-white uppercase tracking-wider mb-2"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          {carName}
        </h3>
        <p className="text-gray-400 text-sm">Live Performance Metrics</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricItem label="Speed" value={`${metrics.speed.value} ${metrics.speed.unit}`} color="#FF0000" />
        <MetricItem label="RPM" value={`${(metrics.rpm.value / 1000).toFixed(1)}K`} color="#FF6B35" />
        <MetricItem label="Gear" value={metrics.gear.toString()} color="#00FF88" />
        <MetricItem label="DRS" value={metrics.drs ? "ON" : "OFF"} color={metrics.drs ? "#00FF00" : "#FF0000"} />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Throttle</span>
            <span className="text-green-500 font-bold text-sm">{metrics.throttle.value}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${metrics.throttle.value}%` }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Brake</span>
            <span className="text-red-500 font-bold text-sm">{metrics.brake.value}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-red-500 to-red-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${metrics.brake.value}%` }}
            />
          </div>
        </div>
      </div>

      {/* Engine & Performance */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 bg-black/60 border border-red-500/20 rounded-lg">
          <p className="text-gray-400 text-xs mb-1">Engine Power</p>
          <p className="text-white font-bold text-lg">{metrics.enginePower.value} {metrics.enginePower.unit}</p>
        </div>
        <div className="p-3 bg-black/60 border border-red-500/20 rounded-lg">
          <p className="text-gray-400 text-xs mb-1">Downforce</p>
          <p className="text-white font-bold text-lg">{metrics.downforce.value} {metrics.downforce.unit}</p>
        </div>
      </div>

      {/* Tire Data */}
      <div className="mb-6">
        <p className="text-gray-400 text-xs mb-3 uppercase tracking-wider">Tire Status</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: "FL", temp: metrics.tireTempFL, pressure: metrics.tirePressureFL },
            { label: "FR", temp: metrics.tireTempFR, pressure: metrics.tirePressureFR },
            { label: "RL", temp: metrics.tireTempRL, pressure: metrics.tirePressureRL },
            { label: "RR", temp: metrics.tireTempRR, pressure: metrics.tirePressureRR },
          ].map((tire) => (
            <div key={tire.label} className="text-center p-2 bg-black/60 border border-red-500/20 rounded">
              <p className="text-white font-bold text-sm mb-1">{tire.label}</p>
              <p className="text-red-400 text-xs">{tire.temp}°C</p>
              <p className="text-green-400 text-xs">{tire.pressure} PSI</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lap Times */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2 bg-black/60 border border-red-500/20 rounded text-center">
          <p className="text-gray-400 text-xs mb-1">Lap Time</p>
          <p className="text-white font-bold text-sm">{metrics.lapTime}</p>
        </div>
        <div className="p-2 bg-black/60 border border-red-500/20 rounded text-center">
          <p className="text-gray-400 text-xs mb-1">S1</p>
          <p className="text-white font-bold text-sm">{metrics.sector1}</p>
        </div>
        <div className="p-2 bg-black/60 border border-red-500/20 rounded text-center">
          <p className="text-gray-400 text-xs mb-1">S2</p>
          <p className="text-white font-bold text-sm">{metrics.sector2}</p>
        </div>
        <div className="p-2 bg-black/60 border border-red-500/20 rounded text-center">
          <p className="text-gray-400 text-xs mb-1">S3</p>
          <p className="text-white font-bold text-sm">{metrics.sector3}</p>
        </div>
      </div>
    </div>
  )
}

// Metric Item Component
function MetricItem({ 
  label, 
  value, 
  color 
}: { 
  label: string
  value: string
  color: string
}) {
  return (
    <div className="p-3 bg-black/60 border border-red-500/20 rounded-lg">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-lg" style={{ color }}>
        {value}
      </p>
    </div>
  )
}

