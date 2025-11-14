"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    // Try to play on mount (will be muted by browser autoplay policy)
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true)
        })
        .catch(() => {
          // Autoplay was prevented, user interaction required
          setIsPlaying(false)
        })
    }

    // Handle audio events
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => {
      // Loop the music
      audio.currentTime = 0
      audio.play()
    }

    audio.addEventListener("play", handlePlay)
    audio.addEventListener("pause", handlePause)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("play", handlePlay)
      audio.removeEventListener("pause", handlePause)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [])

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = 1
      setIsMuted(false)
      // Try to play if not already playing
      if (!isPlaying) {
        audio.play().catch(() => {
          // User interaction required
        })
      }
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  return (
    <>
      <audio
        ref={audioRef}
        src="/assets/loose_my_mind.mp3"
        loop
        preload="auto"
      />
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        onClick={toggleMute}
        className="fixed left-4 top-20 z-40 p-3 rounded-full bg-black/20 backdrop-blur-sm border border-white/10 hover:bg-black/40 hover:border-white/20 transition-all duration-300 group"
        aria-label={isMuted ? "Unmute music" : "Mute music"}
      >
        <motion.svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-white/80 group-hover:text-white transition-colors"
          animate={isMuted ? { opacity: 0.5 } : { opacity: 1 }}
        >
          {isMuted ? (
            // Muted/Crossed out headphone icon
            <>
              <path d="M3 14v-4a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v4" />
              <path d="M18 19a3 3 0 0 1-3-3v-2" />
              <path d="M6 19a3 3 0 0 0 3-3v-2" />
              <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" strokeWidth="2.5" />
            </>
          ) : (
            // Active headphone icon
            <>
              <path d="M3 14v-4a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v4" />
              <path d="M18 19a3 3 0 0 1-3-3v-2" />
              <path d="M6 19a3 3 0 0 0 3-3v-2" />
            </>
          )}
        </motion.svg>
      </motion.button>
    </>
  )
}

