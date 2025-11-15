"use client"

import { motion } from "framer-motion"
import Navbar from "@/components/navbar"
import MusicPlayer from "@/components/music-player"
import F1CarFeaturesDashboard from "@/components/f1-car-features-dashboard"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <MusicPlayer />
      <F1CarFeaturesDashboard />
    </div>
  )
}

