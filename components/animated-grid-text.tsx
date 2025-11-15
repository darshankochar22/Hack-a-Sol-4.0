"use client"

import { motion } from "framer-motion"
import { useState } from "react"

export default function AnimatedGridText() {
  const [isHovering, setIsHovering] = useState(false)

  return (
    <div 
      className="relative w-full max-w-2xl mx-auto mb-8"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Grid background structure */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ff0000" strokeWidth="0.5" opacity="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      {/* Grid overlay lines - enhanced */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between h-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <motion.div
              key={`h-${i}`}
              className="h-px bg-red-500/30"
              initial={{ scaleX: 0 }}
              animate={{ 
                scaleX: isHovering ? 1 : 0.5,
                opacity: isHovering ? 0.6 : 0.3
              }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            />
          ))}
        </div>
        {/* Vertical grid lines */}
        <div className="absolute inset-0 flex justify-between w-full">
          {Array.from({ length: 10 }).map((_, i) => (
            <motion.div
              key={`v-${i}`}
              className="w-px bg-red-500/30"
              initial={{ scaleY: 0 }}
              animate={{ 
                scaleY: isHovering ? 1 : 0.5,
                opacity: isHovering ? 0.6 : 0.3
              }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            />
          ))}
        </div>
      </div>

      {/* GRID Text */}
      <motion.div 
        className="relative z-10 py-16 px-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.7 }}
      >
        <motion.h1
          className="text-7xl md:text-8xl font-black text-center"
          style={{ 
            fontFamily: "var(--font-orbitron)",
            color: "#ff0000",
            textShadow: "0 0 20px rgba(255, 0, 0, 0.5), 0 0 40px rgba(255, 0, 0, 0.3)",
            letterSpacing: "0.1em"
          }}
          animate={{
            textShadow: isHovering 
              ? "0 0 30px rgba(255, 0, 0, 0.8), 0 0 60px rgba(255, 0, 0, 0.5), 0 0 90px rgba(255, 0, 0, 0.3)"
              : "0 0 20px rgba(255, 0, 0, 0.5), 0 0 40px rgba(255, 0, 0, 0.3)",
            scale: isHovering ? 1.05 : 1
          }}
          transition={{ duration: 0.3 }}
        >
          SPEED ?
        </motion.h1>
      </motion.div>

      {/* Grid corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-500 opacity-50" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-500 opacity-50" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-500 opacity-50" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-500 opacity-50" />
    </div>
  )
}



