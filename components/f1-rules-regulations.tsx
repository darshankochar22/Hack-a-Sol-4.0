"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"
import dynamic from "next/dynamic"
import { HeroParallax } from "@/components/ui/hero-parallax"

// Dynamic import for 3D model
const F1Car3D = dynamic(() => import("./f1-car-3d-display"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full w-full">
      <div className="text-white/40 text-sm tracking-widest">LOADING CAR MODEL...</div>
    </div>
  ),
})

type F1RulesProps = {
  onBack?: () => void
}

// F1 Rules Header Component for HeroParallax
function F1RulesHeader() {
  return (
    <div className="max-w-7xl relative mx-auto py-10 md:py-20 px-4 w-full left-0 top-0">
      <div className="flex flex-col items-center justify-center gap-3 lg:gap-4 mb-8">
        <h1
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-[0.9] text-center"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          <span className="block">HALL</span>
          <span className="block">
            <span className="text-red-600 inline-block"> OF </span>
          </span>
          <span className="block"> FAME </span>
        </h1>
      </div>
    </div>
  )
}

export default function F1RulesRegulations({ onBack }: F1RulesProps) {
  const rulesRef = useRef<HTMLDivElement>(null)

  const handleBack = () => {
    if (onBack) {
      onBack()
    }
  }

  // Products for HeroParallax - using racer images from assets
  const products = [
    {
      title: "F1 Racing Rules",
      link: "#",
      thumbnail: "/racer1.png",
    },
    {
      title: "Track Regulations",
      link: "#",
      thumbnail: "/racer2.png",
    },
    {
      title: "Safety Standards",
      link: "#",
      thumbnail: "/racer3.png",
    },
    {
      title: "Technical Rules",
      link: "#",
      thumbnail: "/racer4.png",
    },
    {
      title: "Pit Stop Rules",
      link: "#",
      thumbnail: "/racer5.png",
    },
    {
      title: "Race Format",
      link: "#",
      thumbnail: "/racer6.png",
    },
    {
      title: "Penalty System",
      link: "#",
      thumbnail: "/racer1.png",
    },
    {
      title: "Flag Signals",
      link: "#",
      thumbnail: "/racer2.png",
    },
    {
      title: "Qualifying Rules",
      link: "#",
      thumbnail: "/racer3.png",
    },
    {
      title: "Starting Procedures",
      link: "#",
      thumbnail: "/racer4.png",
    },
    {
      title: "Overtaking Rules",
      link: "#",
      thumbnail: "/racer5.png",
    },
    {
      title: "Track Limits",
      link: "#",
      thumbnail: "/racer6.png",
    },
    {
      title: "Tire Regulations",
      link: "#",
      thumbnail: "/racer1.png",
    },
    {
      title: "Engine Rules",
      link: "#",
      thumbnail: "/racer2.png",
    },
    {
      title: "Championship Points",
      link: "#",
      thumbnail: "/racer3.png",
    },
  ]

  const rules = [
    {
      category: "RACE START PROCEDURES",
      items: [
        "Formation lap must be completed by all drivers",
        "Starting positions determined by qualifying session",
        "False starts result in 5-second time penalty",
        "Jump start leads to 10-second stop-and-go penalty",
        "Drivers must maintain position until green flag",
      ],
    },
    {
      category: "DRIVING STANDARDS",
      items: [
        "Respect track limits - all four wheels must remain within white lines",
        "Causing a collision results in time penalty or disqualification",
        "Dangerous driving leads to immediate black flag",
        "Overtaking only permitted on racing line",
        "Defending position limited to one defensive move per straight",
        "Blocking or weaving is strictly prohibited",
        "Respect yellow flags - no overtaking in yellow flag zones",
        "Blue flags must be obeyed - allow faster cars to pass",
      ],
    },
    {
      category: "PIT STOP RULES",
      items: [
        "Minimum pit stop time enforced (varies by track)",
        "Compulsory tire change required at least once per race",
        "Speed limit in pit lane: 80 km/h (track dependent)",
        "Only one set of tires may be used per stint",
        "Pit lane entry and exit must respect track limits",
        "Illegal pit stop leads to drive-through penalty",
        "Refueling during race is prohibited",
        "Tire change must be completed under pit lane speed limit",
      ],
    },
    {
      category: "TRACK LIMITS & PENALTIES",
      items: [
        "Four wheels must remain within white track lines",
        "Three violations result in time penalty",
        "Five violations result in black-and-white flag warning",
        "Consistent violations may lead to disqualification",
        "Track limits monitored by timing loops",
        "Cutting chicanes results in lap time deletion",
        "Gaining advantage outside track limits = 5-second penalty",
        "Serious violations = drive-through or stop-and-go penalty",
      ],
    },
    {
      category: "SAFETY CAR & RED FLAG",
      items: [
        "No overtaking when Safety Car is deployed",
        "Must maintain position and speed behind Safety Car",
        "Pit lane closed during first lap of Safety Car period",
        "Overtaking prohibited until Safety Car line",
        "Red flag stops race - all cars return to pit lane",
        "Grid positions maintained during red flag period",
        "Race resumes with rolling start behind Safety Car",
        "Drivers must maintain minimum distance from car ahead",
      ],
    },
    {
      category: "FLAG SIGNALS",
      items: [
        "Green Flag: Track clear, racing conditions",
        "Yellow Flag: Danger ahead, no overtaking",
        "Red Flag: Race stopped, return to pits",
        "Blue Flag: Faster car behind, must yield",
        "Black Flag: Disqualification, return to pits",
        "Black & White Flag: Final warning for unsportsmanlike conduct",
        "Chequered Flag: Race finished",
        "White Flag: Slow vehicle on track ahead",
      ],
    },
    {
      category: "TECHNICAL REGULATIONS",
      items: [
        "Minimum car weight: 798 kg (including driver and fuel)",
        "Maximum fuel load: 110 kg",
        "Tire compound selection must be declared pre-race",
        "DRS (Drag Reduction System) usage restricted to designated zones",
        "Power unit changes result in grid penalties",
        "Illegal modifications lead to disqualification",
        "All cars must pass technical inspection post-race",
        "Engine mode restrictions enforced during race",
      ],
    },
    {
      category: "SPRINT RACE FORMAT",
      items: [
        "100 km distance (approximately 30 minutes)",
        "No mandatory pit stops",
        "Grid positions based on qualifying",
        "Points awarded: 1st (8), 2nd (7), 3rd (6), 4th (5), 5th (4), 6th (3), 7th (2), 8th (1)",
        "Race determines Sunday Grand Prix starting grid",
        "Sprint race results count for championship points",
        "Tire compounds: One free choice",
        "Two practice sessions before Sprint",
      ],
    },
    {
      category: "POINT SYSTEM",
      items: [
        "1st Place: 25 points",
        "2nd Place: 18 points",
        "3rd Place: 15 points",
        "4th Place: 12 points",
        "5th Place: 10 points",
        "6th Place: 8 points",
        "7th Place: 6 points",
        "8th Place: 4 points",
        "9th Place: 2 points",
        "10th Place: 1 point",
        "Fastest Lap: 1 point (if in top 10)",
        "Sprint Race: Additional points (1st-8th)",
      ],
    },
    {
      category: "PENALTIES & SANCTIONS",
      items: [
        "Time Penalty: 5, 10, or 15 seconds added to race time",
        "Drive-Through: Drive through pit lane at speed limit",
        "Stop-and-Go: Stop in pit box for 10 seconds, then proceed",
        "Grid Penalty: Start from lower grid position",
        "License Points: Super License penalty points accumulate",
        "12 points in 12 months = one-race ban",
        "Disqualification: Removed from race results",
        "Exclusion: Banned from entire event",
      ],
    },
  ]

  return (
    <div className="relative bg-background text-foreground overflow-x-hidden">
      {/* Hero Parallax Background */}
      <div className="relative">
        <HeroParallax products={products} customHeader={<F1RulesHeader />} />
      </div>

      {/* Rules Section */}
      <motion.div
        ref={rulesRef}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-20 min-h-screen pt-10 pb-20 bg-background"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left Side - Rules Cards */}
            <div className="lg:col-span-2 space-y-6">
              {rules.map((rule, index) => (
                <RuleCard key={rule.category} rule={rule} index={index} />
              ))}
            </div>

            {/* Right Side - 3D Car Model */}
            <div className="lg:col-span-1 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)]">
              <F1Car3D />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Back Button - Fixed */}
      <motion.button
        onClick={handleBack}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 left-8 z-30 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-sm border-2 border-red-500 uppercase tracking-widest transition-all duration-300 shadow-lg"
        style={{ fontFamily: "var(--font-orbitron)" }}
      >
        Back to Track
      </motion.button>
    </div>
  )
}

// Rule Card Component with Scroll Animation
function RuleCard({ rule, index }: { rule: { category: string; items: string[] }; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "start center"],
  })

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1])
  const y = useTransform(scrollYProgress, [0, 1], [50, 0])

  return (
    <motion.div
      ref={ref}
      style={{
        opacity,
        y,
      }}
      className="bg-black/60 border border-red-500/30 rounded-sm p-6 hover:border-red-500/60 transition-all duration-500 backdrop-blur-sm"
    >
      {/* Category Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-red-500/20">
        <div className="w-1 h-8 bg-red-600"></div>
        <h2
          className="text-xl font-bold text-white uppercase tracking-wider"
          style={{ fontFamily: "var(--font-orbitron)" }}
        >
          {rule.category}
        </h2>
      </div>

      {/* Rules List */}
      <ul className="space-y-3">
        {rule.items.map((item, itemIndex) => (
          <motion.li
            key={itemIndex}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ delay: itemIndex * 0.05 }}
            className="flex items-start gap-3 text-gray-300 leading-relaxed"
          >
            <span className="text-red-600 font-bold mt-1 flex-shrink-0">▶</span>
            <span>{item}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}
