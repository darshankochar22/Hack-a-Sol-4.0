"use client"

import { useRef } from "react"
import { motion, useAnimationFrame, useMotionTemplate, useMotionValue, useTransform } from "framer-motion"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ThreeDMarqueeProps {
  images: string[]
  className?: string
  reverse?: boolean
  vertical?: boolean
}

export function ThreeDMarquee({ images, className, reverse, vertical = false }: ThreeDMarqueeProps) {
  return (
    <div
      className={cn(
        "group relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg [perspective:1000px]",
        vertical && "flex-row",
        className,
      )}
    >
      <Marquee reverse={reverse} vertical={vertical}>
        {images.map((src, idx) => (
          <MarqueeItem key={`img-${idx}`} src={src} />
        ))}
      </Marquee>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-background via-transparent to-transparent z-10"></div>
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-background via-transparent to-transparent z-10"></div>
    </div>
  )
}

interface MarqueeProps {
  className?: string
  reverse?: boolean
  pauseOnHover?: boolean
  vertical?: boolean
  children?: React.ReactNode
}

const Marquee = ({
  className,
  reverse,
  pauseOnHover = false,
  vertical = false,
  children,
  ...props
}: MarqueeProps) => {
  const baseX = useMotionValue(0)
  const baseY = useMotionValue(0)
  const shouldPauseRef = useRef(false)

  useAnimationFrame((t, delta) => {
    if (shouldPauseRef.current) return

    const moveBy = reverse ? -200 : 200
    const moveByVertical = reverse ? -200 : 200

    if (vertical) {
      baseY.set(baseY.get() + moveByVertical * (delta / 1000))
    } else {
      baseX.set(baseX.get() + moveBy * (delta / 1000))
    }
  })

  const x = useTransform(baseX, (v) => `${v}px`)
  const y = useTransform(baseY, (v) => `${v}px`)
  const translate = useMotionTemplate`translate${vertical ? "Y" : "X"}(${vertical ? y : x})`

  return (
    <div
      {...props}
      className={cn(
        "flex shrink-0 gap-4",
        vertical ? "flex-col" : "flex-row",
        className,
      )}
      style={{ transform: translate as any }}
      onMouseEnter={() => pauseOnHover && (shouldPauseRef.current = true)}
      onMouseLeave={() => pauseOnHover && (shouldPauseRef.current = false)}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "flex shrink-0 gap-4",
            vertical ? "flex-col" : "flex-row",
          )}
        >
          {children}
        </div>
      ))}
    </div>
  )
}

interface MarqueeItemProps {
  src: string
}

const MarqueeItem = ({ src }: MarqueeItemProps) => {
  return (
    <motion.div
      className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-neutral-700/10 bg-neutral-800/5 backdrop-blur-sm dark:border-neutral-700/20 dark:bg-neutral-800/10 cursor-pointer"
      style={{
        transformStyle: "preserve-3d",
      }}
      whileHover={{
        scale: 1.1,
        z: 50,
      }}
      transition={{
        duration: 0.3,
      }}
    >
      <Image
        src={src}
        alt="Marquee item"
        fill
        className="object-cover"
        sizes="(max-width: 768px) 128px, 128px"
        unoptimized
      />
    </motion.div>
  )
}
