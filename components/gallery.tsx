"use client"

import { motion } from "framer-motion"
import { useState } from "react"

export default function Gallery() {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null)
  const [selectedItem, setSelectedItem] = useState<number | null>(null)

  const galleryItems = [
    { id: 1, type: "image", title: "Pit Stop", emoji: "🏎️", category: "RACE" },
    { id: 2, type: "video", title: "Race Footage", emoji: "📹", category: "HIGHLIGHTS" },
    { id: 3, type: "image", title: "Driver Focus", emoji: "👁️", category: "PORTRAIT" },
    { id: 4, type: "video", title: "Onboard Cam", emoji: "🎥", category: "ONBOARD" },
    { id: 5, type: "image", title: "Podium", emoji: "🏆", category: "CELEBRATION" },
    { id: 6, type: "image", title: "Track View", emoji: "🏁", category: "CIRCUIT" },
    { id: 7, type: "video", title: "Pole Position", emoji: "⚡", category: "QUALIFYING" },
    { id: 8, type: "image", title: "Team Garage", emoji: "🔧", category: "BEHIND-THE-SCENES" },
  ]

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const item = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1 },
  }

  return (
    <section className="min-h-screen bg-background py-20 px-4 relative overflow-hidden">
      {/* Background glow */}
      <motion.div
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
        className="absolute -top-32 -right-32 w-96 h-96 bg-red-500/20 rounded-full blur-3xl pointer-events-none"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-5xl md:text-6xl font-black text-center mb-4 glow-pulse-text"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          GALLERY & HIGHLIGHTS
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center text-gray-400 text-sm tracking-widest mb-16"
        >
          CINEMATIC RACE MOMENTS & BEHIND-THE-SCENES
        </motion.p>

        {/* Masonry grid gallery */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          className="grid md:grid-cols-4 gap-6 mb-12"
        >
          {galleryItems.map((galleryItem, index) => (
            <motion.div
              key={galleryItem.id}
              variants={item}
              onClick={() => setSelectedItem(index)}
              onMouseEnter={() => setHoveredItem(index)}
              onMouseLeave={() => setHoveredItem(null)}
              whileHover={{ scale: 1.05, zIndex: 50 }}
              className={`relative aspect-video rounded-lg overflow-hidden border-2 border-red-500/30 glow-red cursor-pointer group transition-all duration-300 ${
                selectedItem === index ? "md:col-span-2 md:row-span-2 border-red-500" : ""
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
                <div className="text-center">
                  <motion.div
                    animate={hoveredItem === index ? { scale: 1.3, rotate: 10 } : { scale: 1, rotate: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-6xl mb-3"
                  >
                    {galleryItem.emoji}
                  </motion.div>
                  <p className="text-white text-sm font-black">{galleryItem.title}</p>
                  <p className="text-gray-500 text-xs mt-2 font-bold tracking-widest">{galleryItem.category}</p>
                  <p className="text-gray-600 text-xs mt-1">{galleryItem.type.toUpperCase()}</p>
                </div>
              </div>

              {/* Hover effects */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={hoveredItem === index ? { opacity: 0.2 } : { opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-white pointer-events-none"
              />

              {/* Play button for videos */}
              {galleryItem.type === "video" && (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={hoveredItem === index ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-red-500 flex items-center justify-center">
                    <div className="w-0 h-0 border-l-8 border-l-red-500 border-t-5 border-t-transparent border-b-5 border-b-transparent ml-1" />
                  </div>
                </motion.div>
              )}

              {/* Type indicator badge */}
              <div className="absolute top-2 right-2">
                <span className="inline-block px-2 py-1 bg-red-500/80 text-white text-xs font-black rounded-sm">
                  {galleryItem.type === "video" ? "🎬" : "📷"}
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Featured item detail */}
        {selectedItem !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 bg-black border-2 border-red-500/50 rounded-lg text-center"
          >
            <p className="text-red-400 font-black tracking-widest text-sm mb-4">FEATURED MOMENT</p>
            <p className="text-white text-xl font-black mb-2">{galleryItems[selectedItem].title}</p>
            <p className="text-gray-400 text-sm">
              Experience the intensity of Formula 1 racing with exclusive behind-the-scenes content and race highlights.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  )
}
