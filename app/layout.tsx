import type React from "react"
import type { Metadata } from "next"
import { Orbitron, Exo_2 } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const orbitron = Orbitron({ subsets: ["latin"], weight: ["400", "700", "900"] })
const exo2 = Exo_2({ subsets: ["latin"], weight: ["400", "600", "700", "800"] })

export const metadata: Metadata = {
  title: "The Grid Experience - F1 Cinematic Website",
  description:
    "Experience speed like never before. Immersive Formula 1 cinematic website with 3D animations, live telemetry, and interactive experiences.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <style>{`
          :root {
            --font-orbitron: ${orbitron.style.fontFamily};
            --font-exo2: ${exo2.style.fontFamily};
          }
        `}</style>
      </head>
      <body className={`antialiased ${exo2.className}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
