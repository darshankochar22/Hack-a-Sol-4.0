"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from "next/dynamic"
import Image from "next/image"
import AnimatedGridText from "./animated-grid-text"
import Navbar from "./navbar"
import F1RulesRegulations from "./f1-rules-regulations"
import img3 from "../assets/3.png"
import img4 from "../assets/4.png"
import { useEngineSound } from "./engine-sound-controller"

const InteractiveStage = dynamic(() => import("./f1-interactive-stage"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-full items-center justify-center bg-gradient-to-b from-black via-black to-background text-sm tracking-[0.4em] text-white/40">
      INITIALIZING GRID…
    </div>
  ),
})

export default function LandingHero() {
  const [isHovering, setIsHovering] = useState(false)
  const [showNavbar, setShowNavbar] = useState(false)
  const [raceInProgress, setRaceInProgress] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const engineSound = useEngineSound()

  useEffect(() => {
    // Play ambient sound on mount
    setTimeout(() => {
      engineSound.setAmbient()
    }, 1000)
  }, [engineSound])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowNavbar(!entry.isIntersecting)
      },
      { threshold: 0.1 },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  const handleEngineRevv = () => {
    engineSound.play(1)
  }

  const handlePlayNow = () => {
    if (raceInProgress) return
    setRaceInProgress(true)
  }

  const handleRaceEnd = () => {
    setRaceInProgress(false)
    // Redirect to rules page after race ends
    setTimeout(() => {
      setShowRules(true)
    }, 1000) // Small delay for smooth transition
  }

  const handleBackFromRules = () => {
    setShowRules(false)
    // Reset race state if needed
    setRaceInProgress(false)
  }

  // Show rules page if active
  if (showRules) {
    return (
      <>
        {showNavbar && <Navbar />}
        <F1RulesRegulations onBack={handleBackFromRules} />
      </>
    )
  }

  return (
    <>
      {showNavbar && <Navbar />}
      <AnimatePresence mode="wait">
        {!showRules && (
          <section key="hero" className="relative w-full min-h-screen bg-background">
        <div ref={sentinelRef} className="absolute top-0 h-1 w-full" />
        <InteractiveStage raceStarted={raceInProgress} onRaceEnd={handleRaceEnd} />
        <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center z-30">
          <button
            onClick={handlePlayNow}
            disabled={raceInProgress}
            className="pointer-events-auto px-10 py-4 rounded-full border border-white/30 bg-black/60 text-white tracking-[0.5em] text-sm font-semibold uppercase transition hover:border-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            GET STARTED
          </button>
        </div>
      </section>
        )}
      </AnimatePresence>
    </>
  )
}
