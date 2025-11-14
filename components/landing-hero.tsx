"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import dynamic from "next/dynamic"
import Image from "next/image"
import AnimatedGridText from "./animated-grid-text"
import Navbar from "./navbar"
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
  }

  return (
    <>
      {showNavbar && <Navbar />}
      <section className="relative w-full min-h-screen bg-background">
        <div ref={sentinelRef} className="absolute top-0 h-1 w-full" />
        <InteractiveStage raceStarted={raceInProgress} onRaceEnd={handleRaceEnd} />
        <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center z-30">
          <button
            onClick={handlePlayNow}
            disabled={raceInProgress}
            className="pointer-events-auto px-10 py-4 rounded-full border border-white/30 bg-black/60 text-white tracking-[0.5em] text-sm font-semibold uppercase transition hover:border-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-70"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            PLAY NOW
          </button>
        </div>
      </section>
      <section className="relative min-h-screen bg-background overflow-hidden flex flex-col items-center justify-center pt-16">
        {/* Background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-900/10 to-transparent" />
        </div>

        {/* Animated grid background */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ff0000" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
{/* 
        <div className="relative z-10 w-full">
          <Car3DHero />
        </div> */}

        <div className="relative z-10 justify-center items-center max-w-7xl w-full flex flex-col">
          {/* Main heading with 3D model */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mb-6 w-full"
          >
            {/* Layout: Images hugging the heading */}
            <div className="relative flex items-center justify-center w-full max-w-7xl mx-auto px-4">
              {/* Left: Image 3 - Larger and positioned further left */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: -60 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.6 }}
                className="absolute left-0 -translate-x-[45%] sm:-translate-x-[50%] md:-translate-x-[55%] lg:-translate-x-[60%] top-1/2 -translate-y-1/2 z-0"
              >
                <div className="relative w-[280px] sm:w-[360px] md:w-[440px] lg:w-[540px] xl:w-[620px] h-[320px] sm:h-[400px] md:h-[480px] lg:h-[580px] xl:h-[660px]">
                  <Image
                    src={img3}
                    alt="Hero Image 3"
                    fill
                    className="object-contain drop-shadow-[0_0_45px_rgba(255,0,0,0.5)]"
                    priority
                  />
                </div>
              </motion.div>

              {/* Center: Text Content */}
              <div className="text-center flex-1 px-4 sm:px-8 md:px-12 relative z-10">
                {/* "WELCOME TO THE" text above */}
                <h1
                  className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  WELCOME TO THE
                </h1>

                {/* GRID text on grid structure */}
                <AnimatedGridText />
              </div>

              {/* Right: Image 4 - Larger and positioned further right */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 60 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 1, delay: 0.8 }}
                className="absolute right-0 translate-x-[45%] sm:translate-x-[50%] md:translate-x-[55%] lg:translate-x-[60%] top-1/2 -translate-y-1/2 z-0"
              >
                <div className="relative w-[280px] sm:w-[360px] md:w-[440px] lg:w-[540px] xl:w-[620px] h-[320px] sm:h-[400px] md:h-[480px] lg:h-[580px] xl:h-[660px]">
                  <Image
                    src={img4}
                    alt="Hero Image 4"
                    fill
                    className="object-contain drop-shadow-[0_0_45px_rgba(255,0,0,0.5)]"
                    priority
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1 }}
            className="text-xl md:text-2xl text-gray-300 mb-12 font-light tracking-widest"
          >
            EXPERIENCE SPEED LIKE NEVER BEFORE
          </motion.p>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            whileHover={{ scale: 1.05 }}
            onMouseEnter={() => {
              setIsHovering(true)
              handleEngineRevv()
            }}
            onMouseLeave={() => setIsHovering(false)}
            className="px-8 py-4 bg-red-600 text-white font-bold text-lg rounded-sm border-2 border-red-500 glow-red-strong hover:bg-red-700 transition-all duration-300 uppercase tracking-widest"
            style={{ fontFamily: "var(--font-orbitron)" }}
          >
            {isHovering ? "🔥 IGNITE 🔥" : "START YOUR ENGINE"}
          </motion.button>

          {/* Scroll hint */}
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            className="mt-20 text-gray-400 text-sm tracking-widest"
          >
            SCROLL TO ACCELERATE
          </motion.div>
        </div>
      </section>
    </>
  )
}
