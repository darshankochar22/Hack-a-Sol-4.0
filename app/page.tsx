"use client"

import { useEffect, useState } from "react"
import { AnimatePresence } from "framer-motion"
import F1Loader from "@/components/f1-loader"
import LandingHero from "@/components/landing-hero"
import AboutMachine from "@/components/about-machine"
import Experience from "@/components/experience"
import CarEvolution from "@/components/car-evolution"
import DriverTeams from "@/components/driver-teams"
import TracksExplorer from "@/components/tracks-explorer"
import TelemetryDashboard from "@/components/telemetry-dashboard"
import Gallery from "@/components/gallery"
import Leaderboard from "@/components/leaderboard"
import Footer from "@/components/footer"

export default function Home() {
  const [showLoader, setShowLoader] = useState(true)
  const [raceMode, setRaceMode] = useState(false)

  // Easter egg: type "boost" to activate race mode
  useEffect(() => {
    let keyBuffer = ""

    const handleKeyPress = (e: KeyboardEvent) => {
      keyBuffer += e.key.toLowerCase()
      if (keyBuffer.length > 5) keyBuffer = keyBuffer.slice(-5)

      if (keyBuffer.includes("boost")) {
        setRaceMode(true)
        keyBuffer = ""
        setTimeout(() => setRaceMode(false), 5000)
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [])

  return (
    <>
      <AnimatePresence>
        {showLoader && <F1Loader key="loader" onComplete={() => setShowLoader(false)} />}
      </AnimatePresence>

      <main className={`bg-background text-foreground ${raceMode ? "speed-lines" : ""}`}>
        <LandingHero />
        {/* Commented out rest of landing page sections */}
        {/* <AboutMachine />
        <Experience />
        <CarEvolution />
        <DriverTeams />
        <TracksExplorer />
        <TelemetryDashboard />
        <Gallery />
        <Leaderboard />
        <Footer /> */}
      </main>
    </>
  )
}
