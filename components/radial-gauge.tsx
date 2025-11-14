"use client"

import { useRef, useEffect } from "react"

interface RadialGaugeProps {
  label: string
  value: number
  max: number
  unit: string
  color: string
}

export default function RadialGauge({ label, value, max, unit, color }: RadialGaugeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = 200
    canvas.height = 200

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = 70

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background circle
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()

    // Draw gauge background (ring)
    ctx.strokeStyle = "rgba(255, 0, 0, 0.2)"
    ctx.lineWidth = 15
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Draw value gauge (animated progress)
    const percentage = Math.min(value / max, 1)
    const angle = percentage * Math.PI * 2 - Math.PI / 2

    const gradient = ctx.createLinearGradient(
      centerX,
      centerY - radius,
      centerX + radius * Math.cos(angle),
      centerY + radius * Math.sin(angle),
    )
    gradient.addColorStop(0, color)
    gradient.addColorStop(1, "#ff0000")

    ctx.strokeStyle = gradient
    ctx.lineWidth = 15
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, angle)
    ctx.stroke()

    // Draw center circle
    ctx.fillStyle = "#0a0a0a"
    ctx.beginPath()
    ctx.arc(centerX, centerY, 35, 0, Math.PI * 2)
    ctx.fill()

    // Draw border
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, 35, 0, Math.PI * 2)
    ctx.stroke()

    // Draw value text
    ctx.fillStyle = color
    ctx.font = "bold 20px Orbitron"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(value.toString(), centerX, centerY - 5)

    ctx.fillStyle = "#999999"
    ctx.font = "10px Exo2"
    ctx.fillText(unit, centerX, centerY + 12)
  }, [value, max, unit, color])

  return <canvas ref={canvasRef} className="w-full max-w-[200px] mx-auto" />
}
