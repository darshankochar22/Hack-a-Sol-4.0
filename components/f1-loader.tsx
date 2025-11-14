"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import Image from "next/image"

interface F1LoaderProps {
  onComplete: () => void
}

export default function F1Loader({ onComplete }: F1LoaderProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
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
        <Image src="/f1-logo-white.png" alt="F1 Logo" width={300} height={180} priority className="drop-shadow-2xl" />
      </motion.div>
    </motion.div>
  )
}
