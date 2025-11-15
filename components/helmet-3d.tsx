"use client"
import { useRef, useEffect, useState } from "react"

interface Helmet3DProps {
  color: string
  helmetEmoji: string
  isHovered: boolean
}

export default function Helmet3D({ color, helmetEmoji, isHovered }: Helmet3DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [angle, setAngle] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 200
    canvas.height = 250

    let animationId: number
    let currentAngle = 0

    const drawHelmet = (rotation: number) => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((rotation * Math.PI) / 180)

      // Helmet base with gradient
      const gradient = ctx.createRadialGradient(0, 0, 20, 0, 0, 100)
      gradient.addColorStop(0, color)
      gradient.addColorStop(0.5, color)
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.5)")

      // Draw helmet shape
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.ellipse(0, -10, 60, 80, 0, 0, Math.PI * 2)
      ctx.fill()

      // Visor
      ctx.fillStyle = "#1a1a1a"
      ctx.beginPath()
      ctx.ellipse(0, -30, 50, 35, 0, 0, Math.PI * 2)
      ctx.fill()

      // Visor shine
      const visorGradient = ctx.createLinearGradient(-50, -40, 50, -20)
      visorGradient.addColorStop(0, "rgba(255, 255, 255, 0)")
      visorGradient.addColorStop(0.5, "rgba(255, 255, 255, 0.3)")
      visorGradient.addColorStop(1, "rgba(255, 255, 255, 0)")

      ctx.fillStyle = visorGradient
      ctx.beginPath()
      ctx.ellipse(0, -30, 45, 30, 0, 0, Math.PI * 2)
      ctx.fill()

      // Number plate area
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
      ctx.fillRect(-25, 40, 50, 40)
      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.strokeRect(-25, 40, 50, 40)

      // Helmet chin area
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.ellipse(0, 60, 50, 30, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    const animate = () => {
      currentAngle += isHovered ? 8 : 2
      drawHelmet(currentAngle)
      animationId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(animationId)
  }, [color, isHovered])

  return <canvas ref={canvasRef} className="w-full max-w-[200px] mx-auto" />
}
