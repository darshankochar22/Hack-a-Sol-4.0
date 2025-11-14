"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

export default function Car3DHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = window.innerWidth
    canvas.height = 400

    let animationId: number
    let carX = -100
    const carSpeed = 3

    // Initialize audio context
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // Car animation
    const drawCar = (x: number, y: number, scale = 1) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)

      // Car body
      ctx.fillStyle = "#ff0000"
      ctx.fillRect(0, 0, 80, 30)

      // Windows
      ctx.fillStyle = "#4a4a4a"
      ctx.fillRect(15, 5, 20, 15)
      ctx.fillRect(40, 5, 20, 15)

      // Wheels
      ctx.fillStyle = "#000"
      ctx.beginPath()
      ctx.arc(20, 35, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(60, 35, 8, 0, Math.PI * 2)
      ctx.fill()

      // Headlights
      ctx.fillStyle = "#ffff00"
      ctx.fillRect(2, 8, 6, 6)
      ctx.fillRect(2, 18, 6, 6)

      ctx.restore()
    }

    // Glow trail effect
    const drawTrail = (x: number, y: number, progress: number) => {
      const gradient = ctx.createLinearGradient(x - 100, y, x, y)
      gradient.addColorStop(0, "rgba(255, 0, 0, 0)")
      gradient.addColorStop(0.5, "rgba(255, 0, 0, 0.3)")
      gradient.addColorStop(1, "rgba(255, 0, 0, 0.8)")

      ctx.fillStyle = gradient
      ctx.fillRect(x - 100, y - 5, 100, 40)
    }

    const animate = () => {
      // Clear canvas with motion blur effect
      ctx.fillStyle = "rgba(10, 10, 10, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Background grid
      ctx.strokeStyle = "rgba(255, 0, 0, 0.05)"
      ctx.lineWidth = 1
      for (let i = 0; i < canvas.width; i += 50) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }

      const centerY = canvas.height / 2 - 20
      const progress = (carX + 100) / (canvas.width + 200)

      // Draw trail
      if (progress > 0 && progress < 1) {
        drawTrail(carX, centerY, progress)
      }

      // Draw car
      drawCar(carX, centerY, 2)

      // Speed lines
      if (progress > 0 && progress < 1) {
        ctx.strokeStyle = `rgba(255, 0, 0, ${progress * 0.3})`
        ctx.lineWidth = 2
        for (let i = 0; i < 5; i++) {
          ctx.beginPath()
          ctx.moveTo(carX + 80 + i * 20, centerY + 15)
          ctx.lineTo(carX + 80 + i * 20 + 30, centerY + 15)
          ctx.stroke()
        }
      }

      carX += carSpeed
      if (carX > canvas.width + 100) {
        carX = -100
        // Play engine sound loop
        playEngineSound()
      }

      animationId = requestAnimationFrame(animate)
    }

    const playEngineSound = () => {
      if (!audioContextRef.current) return

      const now = audioContextRef.current.currentTime
      const osc = audioContextRef.current.createOscillator()
      const gain = audioContextRef.current.createGain()

      osc.connect(gain)
      gain.connect(audioContextRef.current.destination)

      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(200, now)
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.1)

      gain.gain.setValueAtTime(0.02, now)
      gain.gain.exponentialRampToValueAtTime(0, now + 0.1)

      osc.start(now)
      osc.stop(now + 0.1)
    }

    animate()
    setIsLoaded(true)

    const handleResize = () => {
      canvas.width = window.innerWidth
    }

    window.addEventListener("resize", handleResize)
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      className="relative w-full mb-8"
    >
      <canvas ref={canvasRef} className="w-full border-b-2 border-red-500/30" />
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-background" />
    </motion.div>
  )
}
