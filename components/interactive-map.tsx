"use client"

import { useRef, useEffect, useState } from "react"

interface MapPin {
  id: number
  name: string
  x: number
  y: number
  country: string
}

interface InteractiveMapProps {
  pins: MapPin[]
  selectedPin: number
  onSelectPin: (id: number) => void
}

export default function InteractiveMap({ pins, selectedPin, onSelectPin }: InteractiveMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [hoveredPin, setHoveredPin] = useState<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Draw world map background
    const drawMap = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Simple grid world map
      ctx.strokeStyle = "rgba(255, 0, 0, 0.1)"
      ctx.lineWidth = 1
      for (let i = 0; i < canvas.width; i += 40) {
        ctx.beginPath()
        ctx.moveTo(i, 0)
        ctx.lineTo(i, canvas.height)
        ctx.stroke()
      }
      for (let i = 0; i < canvas.height; i += 40) {
        ctx.beginPath()
        ctx.moveTo(0, i)
        ctx.lineTo(canvas.width, i)
        ctx.stroke()
      }

      // Draw connecting lines between pins
      ctx.strokeStyle = "rgba(255, 0, 0, 0.2)"
      ctx.lineWidth = 1
      ctx.setLineDash([5, 5])
      for (let i = 0; i < pins.length - 1; i++) {
        ctx.beginPath()
        ctx.moveTo(pins[i].x, pins[i].y)
        ctx.lineTo(pins[i + 1].x, pins[i + 1].y)
        ctx.stroke()
      }
      ctx.setLineDash([])

      // Draw pins
      pins.forEach((pin) => {
        const isSelected = selectedPin === pin.id
        const isHovered = hoveredPin === pin.id

        // Pin glow
        if (isSelected || isHovered) {
          const gradient = ctx.createRadialGradient(pin.x, pin.y, 5, pin.x, pin.y, 30)
          gradient.addColorStop(0, "rgba(255, 0, 0, 0.6)")
          gradient.addColorStop(1, "rgba(255, 0, 0, 0)")
          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.arc(pin.x, pin.y, 30, 0, Math.PI * 2)
          ctx.fill()
        }

        // Pin circle
        ctx.fillStyle = isSelected ? "#ff0000" : isHovered ? "#ff6666" : "#cc0000"
        ctx.beginPath()
        ctx.arc(pin.x, pin.y, 8, 0, Math.PI * 2)
        ctx.fill()

        // Pin border
        ctx.strokeStyle = "#ffffff"
        ctx.lineWidth = 2
        ctx.stroke()
      })
    }

    drawMap()

    // Handle mouse movements for interactivity
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setMousePos({ x, y })

      // Check if hovering over any pin
      let hoveredId: number | null = null
      for (const pin of pins) {
        const distance = Math.sqrt((x - pin.x) ** 2 + (y - pin.y) ** 2)
        if (distance < 15) {
          hoveredId = pin.id
          break
        }
      }
      setHoveredPin(hoveredId)
      canvas.style.cursor = hoveredId ? "pointer" : "default"
    }

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      for (const pin of pins) {
        const distance = Math.sqrt((x - pin.x) ** 2 + (y - pin.y) ** 2)
        if (distance < 15) {
          onSelectPin(pin.id)
          break
        }
      }
    }

    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("click", handleClick)

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("click", handleClick)
    }
  }, [pins, selectedPin, hoveredPin, onSelectPin])

  return (
    <canvas
      ref={canvasRef}
      className="w-full border-2 border-red-500/30 rounded-lg bg-gradient-to-br from-gray-900 to-black glow-red"
    />
  )
}
