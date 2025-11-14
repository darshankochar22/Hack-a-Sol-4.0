"use client"

import { useRef, useEffect } from "react"

interface EngineSound {
  play: (intensity: number) => void
  stop: () => void
  setAmbient: () => void
}

export function useEngineSound(): EngineSound {
  const audioContextRef = useRef<AudioContext | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  useEffect(() => {
    // Initialize audio context on first interaction
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
    }

    window.addEventListener("click", initAudio)
    window.addEventListener("touchstart", initAudio)
    return () => {
      window.removeEventListener("click", initAudio)
      window.removeEventListener("touchstart", initAudio)
    }
  }, [])

  return {
    play: (intensity: number) => {
      const ctx = audioContextRef.current
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.type = "triangle"
      const baseFreq = 300 + intensity * 200
      osc.frequency.setValueAtTime(baseFreq, now)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.2)

      gain.gain.setValueAtTime(0.03 * intensity, now)
      gain.gain.exponentialRampToValueAtTime(0, now + 0.2)

      osc.start(now)
      osc.stop(now + 0.2)
    },

    stop: () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop()
        oscillatorRef.current = null
      }
    },

    setAmbient: () => {
      const ctx = audioContextRef.current
      if (!ctx) return

      const now = ctx.currentTime
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.frequency.value = 150
      gain.gain.setValueAtTime(0.01, now)

      osc.start(now)
      // Don't stop, let it loop
      oscillatorRef.current = osc
      gainRef.current = gain
    },
  }
}
