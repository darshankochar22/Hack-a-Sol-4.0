"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useState } from "react"
import { useRef } from "react"

export default function Footer() {
  const [raceMode, setRaceMode] = useState(false)
  const footerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: footerRef,
    offset: ["start end", "end end"],
  })

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])

  const toggleRaceMode = () => {
    setRaceMode(!raceMode)
    if (!raceMode) {
      // Trigger visual effects when race mode activates
      document.body.classList.add("race-mode-active")
    } else {
      document.body.classList.remove("race-mode-active")
    }
  }

  return (
    <footer ref={footerRef} className="bg-black border-t-2 border-red-500/30 py-20 px-4 relative overflow-hidden">
      {/* Animated exhaust effect */}
      <motion.div
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-red-500/20 rounded-full blur-3xl"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          {/* Brand section */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h3
              className="text-2xl font-black text-red-400 mb-4 glow-pulse-text"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              THE GRID
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Experience the ultimate Formula 1 cinematic journey with immersive 3D animations, live telemetry, and
              interactive racing experiences.
            </p>
          </motion.div>

          {/* Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="text-white font-black mb-6 tracking-widest text-sm">NAVIGATION</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              {["Home", "Races", "Drivers", "Teams", "Tracks", "News"].map((item) => (
                <motion.li key={item} whileHover={{ x: 5, color: "#ff0000" }} transition={{ duration: 0.2 }}>
                  <a href="#" className="transition-colors">
                    {item}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Resources */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="text-white font-black mb-6 tracking-widest text-sm">RESOURCES</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              {["Stats & Data", "Highlights", "Schedule", "Standings", "Documentation"].map((item) => (
                <motion.li key={item} whileHover={{ x: 5, color: "#ff0000" }} transition={{ duration: 0.2 }}>
                  <a href="#" className="transition-colors">
                    {item}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Social & Race Mode */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="text-white font-black mb-6 tracking-widest text-sm">CONNECT</h4>

            {/* Social links */}
            <div className="flex gap-3 mb-6">
              {[
                { icon: "𝕏", label: "Twitter" },
                { icon: "📱", label: "Instagram" },
                { icon: "📺", label: "YouTube" },
                { icon: "🎮", label: "Discord" },
              ].map((social) => (
                <motion.a
                  key={social.label}
                  href="#"
                  whileHover={{ scale: 1.3, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full border-2 border-red-500/50 flex items-center justify-center text-red-400 hover:border-red-500 hover:bg-red-500/10 transition-all"
                  title={social.label}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>

            {/* Race Mode Toggle */}
            <motion.button
              onClick={toggleRaceMode}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`w-full px-4 py-2 font-black rounded-sm border-2 transition-all duration-300 tracking-widest text-xs ${
                raceMode
                  ? "bg-red-600 border-red-500 text-white glow-red-strong"
                  : "bg-transparent border-red-500/50 text-red-400 hover:border-red-500"
              }`}
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              {raceMode ? "🔥 RACE MODE" : "⚫ ACTIVATE"}
            </motion.button>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          style={{ opacity }}
          className="pt-8 border-t border-gray-800 text-center text-gray-500 text-xs space-y-2"
        >
          <p>© 2025 THE GRID EXPERIENCE. ALL RIGHTS RESERVED.</p>
          <p>BUILT FOR SPEED | CRAFTED FOR ADRENALINE | ENGINEERED FOR THE FUTURE</p>
        </motion.div>
      </div>
    </footer>
  )
}
