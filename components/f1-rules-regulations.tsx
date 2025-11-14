"use client"

import { useRef } from "react"
import { motion, useScroll, useTransform } from "framer-motion"
import Image from "next/image"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { HeroParallax } from "@/components/ui/hero-parallax"
import { CometCard } from "@/components/ui/comet-card"

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
  const router = useRouter()
  const rulesRef = useRef<HTMLDivElement>(null)

  const handleBack = () => {
    if (onBack) {
      onBack()
    }
  }

  const handleContinue = () => {
    router.push("/dashboard")
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
      description: "Rules governing the start of an F1 race, including formation lap, grid positions, and penalties for false starts.",
      image: "/racer1.png",
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
      description: "Standards and regulations for driver behavior, overtaking, defensive maneuvers, and respect for flags during racing.",
      image: "/racer2.png",
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
      description: "Regulations covering pit lane procedures, mandatory stops, speed limits, and tire change requirements.",
      image: "/racer3.png",
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
      description: "Rules defining track boundaries, violations, and the progressive penalty system for exceeding track limits.",
      image: "/racer4.png",
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
      description: "Procedures for Safety Car periods and red flag situations, including restrictions on overtaking and pit lane access.",
      image: "/racer5.png",
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
      description: "Understanding the various flag signals used in F1 racing to communicate track conditions and driver status.",
      image: "/racer6.png",
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
  ]

  return (
    <div className="relative bg-background text-foreground overflow-x-hidden">
      {/* Hero Parallax Background */}
      <div className="relative">
        <HeroParallax products={products} customHeader={<F1RulesHeader />} />
      </div>

      {/* Rules and Regulations Section */}
      <motion.div
        ref={rulesRef}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative z-20 min-h-screen pt-20 pb-20 bg-background"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Rules and Regulations Heading */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center pt-16 pb-16 mb-16"
          >
            <h2
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-4"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              RULES & REGULATIONS
            </h2>
            <div className="w-32 h-1 bg-red-600 mx-auto"></div>
          </motion.div>

          {/* Rules Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {rules.map((rule, index) => (
              <RuleCometCard key={rule.category} rule={rule} index={index} />
            ))}
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

      {/* Continue Button - Fixed */}
      <motion.button
        onClick={handleContinue}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-8 right-8 z-30 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-sm border-2 border-red-500 uppercase tracking-widest transition-all duration-300 shadow-lg"
        style={{ fontFamily: "var(--font-orbitron)" }}
      >
        Continue
      </motion.button>
    </div>
  )
}

// Rule Comet Card Component
function RuleCometCard({ 
  rule, 
  index 
}: { 
  rule: { 
    category: string
    description: string
    image: string
    items: string[] 
  }
  index: number 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ delay: index * 0.1, duration: 0.6 }}
    >
      <CometCard className="h-full">
        <div className="relative h-full bg-black/80 border border-red-500/30 rounded-2xl overflow-hidden backdrop-blur-sm">
          {/* Image */}
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={rule.image}
              alt={rule.category}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Category Header */}
            <div className="mb-4">
              <div className="w-12 h-1 bg-red-600 mb-3"></div>
              <h3
                className="text-xl font-bold text-white uppercase tracking-wider mb-2"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                {rule.category}
              </h3>
              <p className="text-gray-300 text-sm leading-relaxed">
                {rule.description}
              </p>
            </div>

            {/* Rules List */}
            <ul className="space-y-2 mt-4">
              {rule.items.slice(0, 3).map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  className="flex items-start gap-2 text-gray-400 text-xs leading-relaxed"
                >
                  <span className="text-red-600 font-bold mt-1 flex-shrink-0">▶</span>
                  <span>{item}</span>
                </li>
              ))}
              {rule.items.length > 3 && (
                <li className="text-red-500 text-xs font-semibold mt-2">
                  +{rule.items.length - 3} more rules...
                </li>
              )}
            </ul>
          </div>
        </div>
      </CometCard>
    </motion.div>
  )
}
