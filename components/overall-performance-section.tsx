"use client"

import { motion } from "framer-motion"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts"
import type { Driver, Telemetry, Lap, Position } from "@/lib/openf1-api"

// Helper function for formatting lap time
function formatLapTime(duration: number): string {
  if (!duration || duration === Infinity || isNaN(duration)) return "N/A"
  const minutes = Math.floor(duration / 60)
  const seconds = (duration % 60).toFixed(3)
  return `${minutes}:${seconds.padStart(6, "0")}`
}

// Aggregate Metric Card Component
function AggregateMetricCard({
  label,
  value,
  color,
  icon,
}: {
  label: string
  value: string
  color: string
  icon: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="p-6 bg-black/80 border border-red-500/30 rounded-lg backdrop-blur-sm hover:border-red-500/60 transition-all duration-300"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <p className="text-gray-400 text-xs mb-2 uppercase tracking-wider">{label}</p>
      <p className="text-white font-bold text-2xl" style={{ color }}>
        {value}
      </p>
    </motion.div>
  )
}

// Overall Performance Section Component
export default function OverallPerformanceSection({
  carCards,
  drivers,
  allDriversTelemetry,
  allDriversBestLaps,
  allDriversPositions,
  allDriversLapHistory,
}: {
  carCards: Array<{ title: string; driverAcronyms: string[] }>
  drivers: Record<string, Driver | null>
  allDriversTelemetry: Record<number, Telemetry | null>
  allDriversBestLaps: Record<number, Lap | null>
  allDriversPositions: Record<number, Position | null>
  allDriversLapHistory: Record<number, Lap[]>
}) {
  // Prepare comparison data
  const comparisonData = carCards.map((car) => {
    const driver = drivers[car.title]
    if (!driver) return null
    
    const telemetry = allDriversTelemetry[driver.driver_number]
    const bestLap = allDriversBestLaps[driver.driver_number]
    const position = allDriversPositions[driver.driver_number]
    const laps = allDriversLapHistory[driver.driver_number] || []
    
    // Calculate average lap time
    const validLaps = laps.filter(l => l.lap_duration && !l.is_pit_out_lap && l.lap_duration > 0)
    const avgLapTime = validLaps.length > 0
      ? validLaps.reduce((sum, lap) => sum + (lap.lap_duration || 0), 0) / validLaps.length
      : 0
    
    // Calculate top speed
    const topSpeed = laps.reduce((max, lap) => {
      const speed = lap.i2_speed || lap.i1_speed || 0
      return Math.max(max, speed)
    }, telemetry?.speed || 0)
    
    return {
      carName: car.title,
      driverName: driver.full_name || driver.name_acronym,
      driverNumber: driver.driver_number,
      speed: telemetry?.speed || 0,
      rpm: telemetry?.rpm || 0,
      throttle: (telemetry?.throttle || 0) * 100,
      brake: (telemetry?.brake || 0) * 100,
      gear: telemetry?.n_gear || 0,
      drs: telemetry?.drs === 1,
      bestLapTime: bestLap?.lap_duration || 0,
      avgLapTime,
      position: position?.position || 0,
      topSpeed,
      lapsCount: validLaps.length,
    }
  }).filter((data): data is NonNullable<typeof data> => data !== null)

  // Sort by position
  const sortedData = [...comparisonData].sort((a, b) => (a.position || 999) - (b.position || 999))

  // Prepare chart data
  const speedComparisonData = comparisonData.map((data) => ({
    car: data.carName.split(" ")[0], // Get first word (Mercedes, Oracle, etc.)
    speed: data.speed,
    topSpeed: data.topSpeed,
    rpm: data.rpm / 100, // Scale down for display
  }))

  const lapTimeComparisonData = comparisonData.map((data) => ({
    car: data.carName.split(" ")[0],
    bestLap: data.bestLapTime || 0,
    avgLap: data.avgLapTime || 0,
  }))

  // Calculate aggregate metrics
  const validSpeeds = comparisonData.map(d => d.speed).filter(s => s > 0)
  const avgSpeed = validSpeeds.length > 0 
    ? Math.round(validSpeeds.reduce((sum, s) => sum + s, 0) / validSpeeds.length)
    : 0

  const validBestLaps = comparisonData.map(d => d.bestLapTime).filter(l => l > 0)
  const fastestLap = validBestLaps.length > 0 
    ? Math.min(...validBestLaps)
    : Infinity

  const maxTopSpeed = Math.max(...comparisonData.map(d => d.topSpeed), 0)
  const totalLaps = comparisonData.reduce((sum, d) => sum + d.lapsCount, 0)

  return (
    <div className="space-y-8">
      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="p-8 bg-black/80 border border-red-500/30 rounded-lg backdrop-blur-sm"
      >
        <h3
          className="text-2xl font-bold text-white mb-6 uppercase tracking-wider"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          Current Standings
        </h3>
        <div className="space-y-3">
          {sortedData.map((data, index) => (
            <motion.div
              key={data.carName}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-black/60 border border-red-500/20 rounded-lg hover:border-red-500/60 transition-all duration-300 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                  index === 0 ? "bg-yellow-600 text-black" :
                  index === 1 ? "bg-gray-400 text-black" :
                  index === 2 ? "bg-orange-600 text-white" :
                  "bg-gray-700 text-white"
                }`}>
                  {data.position || index + 1}
                </div>
                <div>
                  <p className="text-white font-bold text-lg">{data.carName}</p>
                  <p className="text-gray-400 text-sm">Driver: {data.driverName}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Best Lap</p>
                  <p className="text-white font-bold">
                    {data.bestLapTime > 0 ? formatLapTime(data.bestLapTime) : "N/A"}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Speed</p>
                  <p className="text-red-500 font-bold">{Math.round(data.speed)} km/h</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-xs">Laps</p>
                  <p className="text-white font-bold">{data.lapsCount}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Speed Comparison Chart */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="p-8 bg-black/80 border border-red-500/30 rounded-lg backdrop-blur-sm"
      >
        <h3
          className="text-2xl font-bold text-white mb-6 uppercase tracking-wider"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          Speed Comparison - All Cars
        </h3>
        <ChartContainer
          config={{
            speed: { label: "Current Speed (km/h)", color: "#FF0000" },
            topSpeed: { label: "Top Speed (km/h)", color: "#FF6B35" },
            rpm: { label: "RPM (x100)", color: "#00FF88" },
          }}
          className="h-96"
        >
          <BarChart data={speedComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="car" stroke="#888" />
            <YAxis yAxisId="left" stroke="#FF0000" />
            <YAxis yAxisId="right" orientation="right" stroke="#00FF88" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar yAxisId="left" dataKey="speed" fill="#FF0000" fillOpacity={0.8} />
            <Bar yAxisId="left" dataKey="topSpeed" fill="#FF6B35" fillOpacity={0.8} />
            <Bar yAxisId="right" dataKey="rpm" fill="#00FF88" fillOpacity={0.6} />
          </BarChart>
        </ChartContainer>
      </motion.div>

      {/* Lap Time Comparison Chart */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="p-8 bg-black/80 border border-red-500/30 rounded-lg backdrop-blur-sm"
      >
        <h3
          className="text-2xl font-bold text-white mb-6 uppercase tracking-wider"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          Lap Time Comparison - All Cars
        </h3>
        <ChartContainer
          config={{
            bestLap: { label: "Best Lap (s)", color: "#FF0000" },
            avgLap: { label: "Average Lap (s)", color: "#00FF88" },
          }}
          className="h-96"
        >
          <BarChart data={lapTimeComparisonData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="car" stroke="#888" />
            <YAxis stroke="#888" />
            <ChartTooltip 
              content={<ChartTooltipContent />}
              formatter={(value: number) => formatLapTime(value)}
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="bestLap" fill="#FF0000" fillOpacity={0.8} />
            <Bar dataKey="avgLap" fill="#00FF88" fillOpacity={0.8} />
          </BarChart>
        </ChartContainer>
      </motion.div>

      {/* Aggregate Metrics Grid */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <AggregateMetricCard
          label="Average Speed"
          value={`${avgSpeed} km/h`}
          color="#FF0000"
          icon="🚀"
        />
        <AggregateMetricCard
          label="Fastest Lap"
          value={formatLapTime(fastestLap)}
          color="#00FF88"
          icon="⏱️"
        />
        <AggregateMetricCard
          label="Top Speed"
          value={`${Math.round(maxTopSpeed)} km/h`}
          color="#FF6B35"
          icon="🔥"
        />
        <AggregateMetricCard
          label="Total Laps"
          value={totalLaps.toString()}
          color="#0066FF"
          icon="🏁"
        />
      </motion.div>
    </div>
  )
}

