"use client"

import { useRef, useState, useEffect } from "react"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import Image from "next/image"
import dynamic from "next/dynamic"
import RadialGauge from "./radial-gauge"
import { FocusCards } from "@/components/ui/focus-cards"
import { CometCard } from "@/components/ui/comet-card"
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import OverallPerformanceSection from "./overall-performance-section"
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"
import car1 from "../assets/car1.jpg"
import car2 from "../assets/car2.jpg"
import car3 from "../assets/car3.jpg"
import car4 from "../assets/car4.jpg"
import {
  getLatestSession,
  getDriverByTeam,
  getLatestTelemetry,
  getTelemetryHistory,
  getLatestLap,
  getLapHistory,
  getAllDriversLatestTelemetry,
  getAllDriversBestLaps,
  getAllDriversPositions,
  getAllDriversLapHistory,
  type Driver,
  type Telemetry,
  type Lap,
  type Session,
  type Position,
} from "@/lib/openf1-api"

// Dynamic import for 3D car visualization
const F1Car3DVisualization = dynamic(() => import("./f1-car-3d-visualization").then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => (
    <div className="flex h-96 w-full items-center justify-center bg-black/40 border border-red-500/30 rounded-lg text-sm text-white/40">
      Loading 3D Visualization...
    </div>
  ),
})

export default function F1CarFeaturesDashboard() {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  // State for real-time data
  const [session, setSession] = useState<Session | null>(null)
  const [drivers, setDrivers] = useState<Record<string, Driver | null>>({})
  const [telemetry, setTelemetry] = useState<Record<string, Telemetry | null>>({})
  const [telemetryHistory, setTelemetryHistory] = useState<Record<string, Telemetry[]>>({})
  const [laps, setLaps] = useState<Record<string, Lap | null>>({})
  const [lapHistory, setLapHistory] = useState<Record<string, Lap[]>>({})
  const [loading, setLoading] = useState(true)

  // State for overall performance data (all cars)
  const [allDriversTelemetry, setAllDriversTelemetry] = useState<Record<number, Telemetry | null>>({})
  const [allDriversBestLaps, setAllDriversBestLaps] = useState<Record<number, Lap | null>>({})
  const [allDriversPositions, setAllDriversPositions] = useState<Record<number, Position | null>>({})
  const [allDriversLapHistory, setAllDriversLapHistory] = useState<Record<number, Lap[]>>({})

  // Car cards data with real F1 car names
  const carCards = [
    { title: "Mercedes-AMG F1 W15", src: (car1 as { src: string }).src || String(car1), driverAcronyms: ["HAM", "RUS"] },
    { title: "Oracle Red Bull Racing RB20", src: (car2 as { src: string }).src || String(car2), driverAcronyms: ["VER", "PER"] },
    { title: "Scuderia Ferrari SF-24", src: (car3 as { src: string }).src || String(car3), driverAcronyms: ["LEC", "SAI"] },
    { title: "McLaren F1 Team MCL38", src: (car4 as { src: string }).src || String(car4), driverAcronyms: ["NOR", "PIA"] },
  ]

  const [hoveredCardIndex, setHoveredCardIndex] = useState<number | null>(null)
  const [selectedCarIndex, setSelectedCarIndex] = useState<number | null>(null)

  // Handle card click for selection/deselection
  const handleCardClick = (index: number) => {
    if (selectedCarIndex === index) {
      // Deselect if clicking the same card
      setSelectedCarIndex(null)
      setHoveredCardIndex(null)
    } else {
      // Select the clicked card
      setSelectedCarIndex(index)
      setHoveredCardIndex(index)
    }
  }

  // Generate mock telemetry data when API is unavailable (defined early for use in useEffect)
  const generateMockTelemetry = (carTitle: string): Telemetry => {
    const baseSpeed = 300 + Math.random() * 80
    const baseRPM = 12000 + Math.random() * 3000
    return {
      brake: Math.random() * 0.3,
      date: new Date().toISOString(),
      driver_number: 1,
      drs: Math.random() > 0.5 ? 1 : 0,
      n_gear: Math.floor(6 + Math.random() * 3),
      rpm: Math.round(baseRPM),
      speed: Math.round(baseSpeed),
      throttle: 0.7 + Math.random() * 0.3,
      session_key: 0,
    }
  }

  // Generate mock lap data (defined early for use in useEffect)
  const generateMockLap = (): Lap => {
    const sector1 = 28 + Math.random() * 2
    const sector2 = 34 + Math.random() * 2
    const sector3 = 19 + Math.random() * 2
    return {
      date_start: new Date().toISOString(),
      driver_number: 1,
      duration_sector_1: sector1,
      duration_sector_2: sector2,
      duration_sector_3: sector3,
      i1_speed: 280 + Math.random() * 50,
      i2_speed: 290 + Math.random() * 60,
      is_pit_out_lap: false,
      lap_duration: sector1 + sector2 + sector3,
      lap_number: Math.floor(1 + Math.random() * 50),
      meeting_key: 0,
      segments_sector_1: null,
      segments_sector_2: null,
      segments_sector_3: null,
      session_key: 0,
    }
  }

  // Fetch initial session and driver data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true)
      try {
        // Get latest session
        const latestSession = await getLatestSession()
        setSession(latestSession)

        // Initialize with mock data first (always available)
        const initialTelemetryData: Record<string, Telemetry | null> = {}
        const initialTelemetryHistoryData: Record<string, Telemetry[]> = {}
        const initialLapsData: Record<string, Lap | null> = {}
        const initialLapHistoryData: Record<string, Lap[]> = {}

        for (const car of carCards) {
          // Initialize with mock data
          const mockTelemetry = generateMockTelemetry(car.title)
          const mockLap = generateMockLap()
          
          initialTelemetryData[car.title] = mockTelemetry
          initialTelemetryHistoryData[car.title] = Array.from({ length: 20 }, () => generateMockTelemetry(car.title))
          initialLapsData[car.title] = mockLap
          initialLapHistoryData[car.title] = Array.from({ length: 10 }, () => generateMockLap())
        }

        setTelemetry(initialTelemetryData)
        setTelemetryHistory(initialTelemetryHistoryData)
        setLaps(initialLapsData)
        setLapHistory(initialLapHistoryData)

        if (latestSession) {
          // Fetch drivers for each car
          const driversData: Record<string, Driver | null> = {}
          for (const car of carCards) {
            try {
              const driver = await getDriverByTeam(car.title, latestSession.session_key)
              driversData[car.title] = driver
            } catch (error) {
              console.warn(`Error fetching driver for ${car.title}:`, error)
              driversData[car.title] = null
            }
          }
          setDrivers(driversData)

          // Try to fetch real telemetry and lap data, but keep mock data as fallback
          const telemetryData: Record<string, Telemetry | null> = { ...initialTelemetryData }
          const telemetryHistoryData: Record<string, Telemetry[]> = { ...initialTelemetryHistoryData }
          const lapsData: Record<string, Lap | null> = { ...initialLapsData }
          const lapHistoryData: Record<string, Lap[]> = { ...initialLapHistoryData }

          for (const car of carCards) {
            const driver = driversData[car.title]
            if (driver) {
              try {
                const [telemetryResult, telemetryHistResult, lapResult, lapHistResult] = await Promise.all([
                  getLatestTelemetry(driver.driver_number, latestSession.session_key),
                  getTelemetryHistory(driver.driver_number, latestSession.session_key, 50),
                  getLatestLap(driver.driver_number, latestSession.session_key),
                  getLapHistory(driver.driver_number, latestSession.session_key, 20),
                ])
                
                // Only update if we got real data
                if (telemetryResult) telemetryData[car.title] = telemetryResult
                if (telemetryHistResult && telemetryHistResult.length > 0) {
                  telemetryHistoryData[car.title] = telemetryHistResult
                }
                if (lapResult) lapsData[car.title] = lapResult
                if (lapHistResult && lapHistResult.length > 0) {
                  lapHistoryData[car.title] = lapHistResult
                }
              } catch (error) {
                console.warn(`Error fetching data for ${car.title}:`, error)
                // Keep mock data
              }
            }
          }

          setTelemetry(telemetryData)
          setTelemetryHistory(telemetryHistoryData)
          setLaps(lapsData)
          setLapHistory(lapHistoryData)

          // Fetch overall performance data for all drivers
          try {
            const [allTelemetry, allBestLaps, allPositions, allLapHistory] = await Promise.all([
              getAllDriversLatestTelemetry(latestSession.session_key),
              getAllDriversBestLaps(latestSession.session_key),
              getAllDriversPositions(latestSession.session_key),
              getAllDriversLapHistory(latestSession.session_key, 20),
            ])
            
            setAllDriversTelemetry(allTelemetry)
            setAllDriversBestLaps(allBestLaps)
            setAllDriversPositions(allPositions)
            setAllDriversLapHistory(allLapHistory)
          } catch (error) {
            console.warn("Error fetching overall performance data:", error)
            // Initialize with empty data, will use mock data in components
            setAllDriversTelemetry({})
            setAllDriversBestLaps({})
            setAllDriversPositions({})
            setAllDriversLapHistory({})
          }
        } else {
          // No session found - initialize with empty overall data (will use mock in components)
          setAllDriversTelemetry({})
          setAllDriversBestLaps({})
          setAllDriversPositions({})
          setAllDriversLapHistory({})
        }
      } catch (error) {
        console.error("Error fetching initial data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialData()
  }, [])

  // Update telemetry every 2 seconds (real-time or mock data)
  useEffect(() => {
    const interval = setInterval(async () => {
      const updatedTelemetry: Record<string, Telemetry | null> = { ...telemetry }
      const updatedTelemetryHistory: Record<string, Telemetry[]> = { ...telemetryHistory }
      
      for (const car of carCards) {
        const driver = drivers[car.title]
        
        if (session && driver) {
          // Try to fetch real telemetry
          try {
            const latestTelemetry = await getLatestTelemetry(driver.driver_number, session.session_key)
            if (latestTelemetry) {
              updatedTelemetry[car.title] = latestTelemetry
              // Update history (keep last 50 points)
              updatedTelemetryHistory[car.title] = [
                ...(updatedTelemetryHistory[car.title] || []).slice(-49),
                latestTelemetry,
              ]
            } else {
              // Generate mock data if API doesn't return data
              const mockTelemetry = generateMockTelemetry(car.title)
              updatedTelemetry[car.title] = mockTelemetry
              updatedTelemetryHistory[car.title] = [
                ...(updatedTelemetryHistory[car.title] || []).slice(-49),
                mockTelemetry,
              ]
            }
          } catch (error) {
            console.warn(`Error fetching telemetry for ${car.title}, using mock data:`, error)
            // Generate mock data on error
            const mockTelemetry = generateMockTelemetry(car.title)
            updatedTelemetry[car.title] = mockTelemetry
            updatedTelemetryHistory[car.title] = [
              ...(updatedTelemetryHistory[car.title] || []).slice(-49),
              mockTelemetry,
            ]
          }
        } else {
          // No session or driver - use mock data
          const mockTelemetry = generateMockTelemetry(car.title)
          updatedTelemetry[car.title] = mockTelemetry
          updatedTelemetryHistory[car.title] = [
            ...(updatedTelemetryHistory[car.title] || []).slice(-49),
            mockTelemetry,
          ]
        }
      }
      
      setTelemetry(updatedTelemetry)
      setTelemetryHistory(updatedTelemetryHistory)
    }, 2000)

    return () => clearInterval(interval)
  }, [session, drivers, telemetry, telemetryHistory])

  // Get metrics for a car based on real-time data or fallback to mock data
  const getCarMetrics = (carTitle: string): CarMetrics => {
    const currentTelemetry = telemetry[carTitle] || generateMockTelemetry(carTitle)
    const currentLap = laps[carTitle] || generateMockLap()
    const driver = drivers[carTitle]

    // Use mock data if no real driver found
    const driverNumber = driver?.driver_number || 1
    const driverName = driver?.full_name || driver?.name_acronym || carTitle.split(" ")[0]

    // Calculate tire temps based on speed and RPM (simulated)
    const tireBaseTemp = 85 + (currentTelemetry.speed / 5) + (currentTelemetry.rpm / 200)
    const tireTempFL = Math.round(tireBaseTemp + (Math.random() * 10 - 5))
    const tireTempFR = Math.round(tireBaseTemp + (Math.random() * 10 - 5))
    const tireTempRL = Math.round(tireBaseTemp + 3 + (Math.random() * 10 - 5))
    const tireTempRR = Math.round(tireBaseTemp + 3 + (Math.random() * 10 - 5))

    return {
      speed: { value: currentTelemetry.speed || 0, max: 380, unit: "km/h" },
      rpm: { value: currentTelemetry.rpm || 0, max: 15000, unit: "RPM" },
      throttle: { value: (currentTelemetry.throttle || 0) * 100, max: 100, unit: "%" },
      brake: { value: (currentTelemetry.brake || 0) * 100, max: 100, unit: "%" },
      gear: currentTelemetry.n_gear || 0,
      drs: currentTelemetry.drs === 1,
      enginePower: { value: 1050 + Math.random() * 50, max: 1100, unit: "HP" }, // Estimated with variation
      downforce: { value: 850 + Math.random() * 100, max: 1000, unit: "KG" }, // Estimated with variation
      fuelLevel: { value: 65 + Math.random() * 20, max: 100, unit: "%" }, // Estimated with variation
      tireTempFL: Math.max(85, Math.min(105, tireTempFL)),
      tireTempFR: Math.max(85, Math.min(105, tireTempFR)),
      tireTempRL: Math.max(88, Math.min(108, tireTempRL)),
      tireTempRR: Math.max(88, Math.min(108, tireTempRR)),
      tirePressureFL: 21.5 + Math.random() * 0.5,
      tirePressureFR: 21.8 + Math.random() * 0.5,
      tirePressureRL: 20.5 + Math.random() * 0.5,
      tirePressureRR: 20.8 + Math.random() * 0.5,
      lapTime: formatLapTime(currentLap.lap_duration),
      sector1: formatSectorTime(currentLap.duration_sector_1),
      sector2: formatSectorTime(currentLap.duration_sector_2),
      sector3: formatSectorTime(currentLap.duration_sector_3),
      driverNumber: driverNumber,
      driverName: driverName,
    }
  }

  const formatLapTime = (duration: number | null): string => {
    if (!duration) return "N/A"
    const minutes = Math.floor(duration / 60)
    const seconds = (duration % 60).toFixed(3)
    return `${minutes}:${seconds.padStart(6, "0")}`
  }

  const formatSectorTime = (duration: number | null): string => {
    if (!duration) return "N/A"
    return duration.toFixed(3)
  }

  const getHeatmapColor = (value: number, max: number) => {
    const ratio = value / max
    if (ratio > 0.9) return "bg-red-600"
    if (ratio > 0.7) return "bg-orange-500"
    if (ratio > 0.5) return "bg-yellow-500"
    if (ratio > 0.3) return "bg-green-500"
    return "bg-blue-500"
  }

  // Get selected car metrics
  const selectedCar = selectedCarIndex !== null ? carCards[selectedCarIndex] : null
  const selectedMetrics = selectedCar ? getCarMetrics(selectedCar.title) : null
  const selectedTelemetryHistory = selectedCar ? telemetryHistory[selectedCar.title] || [] : []
  const selectedLapHistory = selectedCar ? lapHistory[selectedCar.title] || [] : []

  // Prepare chart data - use mock data if no history available
  const speedChartData = selectedTelemetryHistory.length > 0
    ? selectedTelemetryHistory.map((t, index) => ({
        time: index,
        speed: t.speed || 0,
        rpm: (t.rpm || 0) / 100, // Scale down for display
      }))
    : Array.from({ length: 20 }, (_, i) => ({
        time: i,
        speed: 300 + Math.sin(i / 2) * 30 + Math.random() * 20,
        rpm: (12000 + Math.sin(i / 2) * 2000 + Math.random() * 1000) / 100,
      }))

  const lapTimeChartData = selectedLapHistory.length > 0
    ? selectedLapHistory.map((lap, index) => ({
        lap: lap.lap_number || index + 1,
        duration: lap.lap_duration || 0,
        sector1: lap.duration_sector_1 || 0,
        sector2: lap.duration_sector_2 || 0,
        sector3: lap.duration_sector_3 || 0,
      }))
    : Array.from({ length: 10 }, (_, i) => {
        const baseTime = 82
        return {
          lap: i + 1,
          duration: baseTime + Math.random() * 2,
          sector1: 28 + Math.random() * 1,
          sector2: 34 + Math.random() * 1,
          sector3: 19 + Math.random() * 0.5,
        }
      })

  // Generate tire heatmap data from telemetry (simulated based on speed/rpm)
  const generateTireHeatmap = (): number[][] => {
    const currentTelemetry = selectedCar ? telemetry[selectedCar.title] : null
    if (!currentTelemetry) {
      return [
        [85, 90, 95, 100, 98, 92, 88],
        [80, 88, 94, 100, 98, 95, 90],
        [75, 85, 92, 98, 96, 93, 88],
        [70, 82, 90, 95, 94, 90, 85],
        [68, 80, 88, 93, 91, 88, 82],
      ]
    }

    // Generate heatmap based on speed and RPM
    const baseTemp = 85 + (currentTelemetry.speed / 4) + (currentTelemetry.rpm / 200)
    const heatmap: number[][] = []
    for (let row = 0; row < 5; row++) {
      const rowData: number[] = []
      for (let col = 0; col < 7; col++) {
        const variation = (Math.sin(row + col) * 5) + (Math.random() * 10)
        rowData.push(Math.min(100, Math.max(68, baseTemp + variation)))
      }
      heatmap.push(rowData)
    }
    return heatmap
  }

  const tireHeatmap = generateTireHeatmap()

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
            Real-Time Performance Analytics & Telemetry
          </p>
          {session && (
            <p className="text-gray-500 text-xs mt-2 relative z-10">
              Session: {session.session_name} • {new Date(session.date_start).toLocaleDateString()}
            </p>
          )}
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
              cards={carCards.map(c => ({ title: c.title, src: c.src }))} 
              columns={4} 
              selectedIndex={selectedCarIndex}
              onCardHover={(index) => {
                setHoveredCardIndex(index)
              }}
              onCardClick={handleCardClick}
            />
          </div>
          
          {/* Hover Metrics Card - Only show on hover, not on selection */}
          <AnimatePresence>
            {hoveredCardIndex !== null && hoveredCardIndex !== selectedCarIndex && carCards[hoveredCardIndex] && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ duration: 0.3 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-8 z-50 w-full max-w-2xl px-4 pointer-events-none"
              >
                <CometCard>
                  <CarMetricsCard 
                    carName={carCards[hoveredCardIndex].title}
                    metrics={getCarMetrics(carCards[hoveredCardIndex].title)}
                  />
                </CometCard>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Overall Performance Section - Only show when no car is selected */}
        {!loading && session && Object.keys(allDriversTelemetry).length > 0 && selectedCarIndex === null && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="mb-16"
          >
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-8 uppercase tracking-wider text-center"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              Overall Performance Summary
            </h2>
            
            <OverallPerformanceSection
              carCards={carCards.map(c => ({ title: c.title, driverAcronyms: c.driverAcronyms }))}
              drivers={drivers}
              allDriversTelemetry={allDriversTelemetry}
              allDriversBestLaps={allDriversBestLaps}
              allDriversPositions={allDriversPositions}
              allDriversLapHistory={allDriversLapHistory}
            />
          </motion.div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <p className="text-white text-lg">Loading real-time F1 data...</p>
          </div>
        ) : selectedCarIndex !== null && selectedCar && selectedMetrics ? (
          <>
            {/* 3D Car Visualization */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="mb-16"
            >
              <h2
                className="text-2xl md:text-3xl font-bold text-white mb-6 uppercase tracking-wider"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                3D Car Visualization - {selectedCar.title}
              </h2>
              <F1Car3DVisualization 
                speed={selectedMetrics.speed.value}
                rpm={selectedMetrics.rpm.value}
                throttle={selectedMetrics.throttle.value}
              />
            </motion.div>

            {/* Real-Time Performance Metrics */}
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
                Real-Time Performance Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <PerformanceGauge 
                  label="SPEED" 
                  value={selectedMetrics.speed.value} 
                  max={selectedMetrics.speed.max} 
                  unit={selectedMetrics.speed.unit}
                  color="#FF0000"
                />
                <PerformanceGauge 
                  label="RPM" 
                  value={selectedMetrics.rpm.value} 
                  max={selectedMetrics.rpm.max} 
                  unit={selectedMetrics.rpm.unit}
                  color="#FF6B35"
                />
                <PerformanceGauge 
                  label="THROTTLE" 
                  value={selectedMetrics.throttle.value} 
                  max={selectedMetrics.throttle.max} 
                  unit={selectedMetrics.throttle.unit}
                  color="#00FF88"
                />
                <PerformanceGauge 
                  label="BRAKE" 
                  value={selectedMetrics.brake.value} 
                  max={selectedMetrics.brake.max} 
                  unit={selectedMetrics.brake.unit}
                  color="#FF4444"
                />
              </div>
            </motion.div>

            {/* Speed & RPM Graph */}
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
                Speed & RPM Over Time
              </h2>
              <ChartContainer
                config={{
                  speed: { label: "Speed (km/h)", color: "#FF0000" },
                  rpm: { label: "RPM (x100)", color: "#FF6B35" },
                }}
                className="h-96"
              >
                <LineChart data={speedChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="time" stroke="#888" />
                  <YAxis yAxisId="left" stroke="#FF0000" />
                  <YAxis yAxisId="right" orientation="right" stroke="#FF6B35" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="speed" 
                    stroke="#FF0000" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="rpm" 
                    stroke="#FF6B35" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </motion.div>

            {/* Lap Times Graph */}
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
                Lap Times Analysis
              </h2>
              <ChartContainer
                config={{
                  duration: { label: "Lap Time (s)", color: "#FF0000" },
                  sector1: { label: "Sector 1 (s)", color: "#00FF88" },
                  sector2: { label: "Sector 2 (s)", color: "#FF6B35" },
                  sector3: { label: "Sector 3 (s)", color: "#0066FF" },
                }}
                className="h-96"
              >
                <AreaChart data={lapTimeChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="lap" stroke="#888" />
                  <YAxis stroke="#888" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Area type="monotone" dataKey="duration" stackId="1" stroke="#FF0000" fill="#FF0000" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="sector1" stackId="2" stroke="#00FF88" fill="#00FF88" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="sector2" stackId="2" stroke="#FF6B35" fill="#FF6B35" fillOpacity={0.4} />
                  <Area type="monotone" dataKey="sector3" stackId="2" stroke="#0066FF" fill="#0066FF" fillOpacity={0.4} />
                </AreaChart>
              </ChartContainer>
            </motion.div>

            {/* Tire Temperature Heatmap */}
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
                Tire Temperature Heatmap
              </h2>
              <div className="flex flex-col gap-2">
                {tireHeatmap.map((row, rowIndex) => (
                  <div key={rowIndex} className="flex gap-2 justify-center">
                    {row.map((value, colIndex) => (
                      <motion.div
                        key={colIndex}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: (rowIndex + colIndex) * 0.05 }}
                        className={`w-16 h-16 ${getHeatmapColor(value, 100)} rounded-sm border border-black/50 flex items-center justify-center text-white font-bold text-xs transition-all duration-300 hover:scale-110`}
                      >
                        {Math.round(value)}°C
                      </motion.div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex justify-center gap-4 mt-6">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-gray-400 text-xs">Low (68-75°C)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-gray-400 text-xs">Optimal (75-85°C)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-gray-400 text-xs">High (85-92°C)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-gray-400 text-xs">Very High (92-96°C)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-600 rounded"></div>
                  <span className="text-gray-400 text-xs">Critical (96-100°C)</span>
                </div>
              </div>
            </motion.div>

            {/* Telemetry Comparison Graph */}
            {selectedTelemetryHistory.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="mb-16 p-8 bg-black/80 border border-red-500/30 rounded-lg backdrop-blur-sm"
              >
                <h2
                  className="text-2xl md:text-3xl font-bold text-white mb-6 uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  Throttle & Brake Analysis
                </h2>
                <ChartContainer
                  config={{
                    throttle: { label: "Throttle (%)", color: "#00FF88" },
                    brake: { label: "Brake (%)", color: "#FF4444" },
                  }}
                  className="h-96"
                >
                  <BarChart data={selectedTelemetryHistory.slice(-20).map((t, i) => ({
                    time: i,
                    throttle: (t.throttle || 0) * 100,
                    brake: (t.brake || 0) * 100,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="time" stroke="#888" />
                    <YAxis stroke="#888" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="throttle" fill="#00FF88" fillOpacity={0.8} />
                    <Bar dataKey="brake" fill="#FF4444" fillOpacity={0.8} />
                  </BarChart>
                </ChartContainer>
              </motion.div>
            )}

            {/* Commented out other sections */}
            {/*
            Performance Metrics
            Aerodynamic Heatmap
            Speed Graph
            Tire Analysis
            */}
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-white text-lg">No data available. Please select a car.</p>
          </div>
        )}

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

        {/* Play Now Button - Only show when a car is selected */}
        <AnimatePresence>
          {selectedCarIndex !== null && (
            <motion.button
              onClick={() => {
                // Handle play action here - you can navigate or trigger race simulation
                console.log("Play Now clicked for:", carCards[selectedCarIndex]?.title)
                // You can add navigation to race simulation here
                // router.push('/race-simulation')
              }}
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              transition={{ duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="fixed bottom-8 right-8 z-30 px-8 py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg border-2 border-green-500 uppercase tracking-widest transition-all duration-300 shadow-lg flex items-center gap-3"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              <span>▶</span>
              <span>Play Now</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Performance Gauge Component
function PerformanceGauge({ 
  label, 
  value, 
  max, 
  unit, 
  color 
}: { 
  label: string
  value: number
  max: number
  unit: string
  color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="p-6 bg-black/80 border border-red-500/30 rounded-lg backdrop-blur-sm hover:border-red-500/60 transition-all duration-300"
    >
      <RadialGauge
        label={label}
        value={Math.round(value)}
        max={max}
        unit={unit}
        color={color}
      />
    </motion.div>
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
  driverNumber: number
  driverName: string
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
        <p className="text-gray-400 text-sm">Driver: {metrics.driverName}</p>
        <p className="text-gray-400 text-xs">Live Performance Metrics</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricItem label="Speed" value={`${metrics.speed.value.toFixed(1)} ${metrics.speed.unit}`} color="#FF0000" />
        <MetricItem label="RPM" value={`${(metrics.rpm.value / 1000).toFixed(1)}K`} color="#FF6B35" />
        <MetricItem label="Gear" value={metrics.gear.toString()} color="#00FF88" />
        <MetricItem label="DRS" value={metrics.drs ? "ON" : "OFF"} color={metrics.drs ? "#00FF00" : "#FF0000"} />
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Throttle</span>
            <span className="text-green-500 font-bold text-sm">{metrics.throttle.value.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, metrics.throttle.value)}%` }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-xs">Brake</span>
            <span className="text-red-500 font-bold text-sm">{metrics.brake.value.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-red-500 to-red-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, metrics.brake.value)}%` }}
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
