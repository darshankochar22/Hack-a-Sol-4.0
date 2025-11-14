"use client"

import { useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

interface F1LoaderOverlayProps {
  show: boolean
  onComplete: () => void
  duration?: number // Duration in seconds
}

export default function F1LoaderOverlay({ show, onComplete, duration = 3 }: F1LoaderOverlayProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete()
      }, duration * 1000)

      return () => clearTimeout(timer)
    }
  }, [show, onComplete, duration])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center"
        >
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: "black",
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          <motion.div
            animate={{
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
            className="relative z-10 flex items-center justify-center"
          >
            <Image 
              src="/f1-logo-white.png" 
              alt="F1 Logo" 
              width={300} 
              height={180} 
              priority 
              className="drop-shadow-2xl" 
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

