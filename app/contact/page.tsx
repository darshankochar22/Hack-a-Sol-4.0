"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import Navbar from "@/components/navbar"
import MusicPlayer from "@/components/music-player"
import Footer from "@/components/footer"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus("idle")

    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false)
      setSubmitStatus("success")
      setFormData({ name: "", email: "", subject: "", message: "" })
      
      setTimeout(() => {
        setSubmitStatus("idle")
      }, 3000)
    }, 1000)
  }

  const socialLinks = [
    { platform: "GitHub", icon: "💻", url: "#" },
    { platform: "Twitter", icon: "𝕏", url: "#" },
    { platform: "LinkedIn", icon: "💼", url: "#" },
    { platform: "Discord", icon: "🎮", url: "#" },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <MusicPlayer />
      
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none z-0">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="contact-grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ff0000" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#contact-grid)" />
        </svg>
      </div>

      <div className="relative z-10 pt-20 pb-20 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white mb-4"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              CONTACT US
            </h1>
            <div className="w-32 h-1 bg-red-600 mx-auto mb-4"></div>
            <p className="text-gray-400 text-sm tracking-widest uppercase mb-2">
              Get in Touch with Team Kaju Katli
            </p>
            <p className="text-red-500 text-lg font-bold tracking-wider">
              Hack-a-Sol 4.0
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="bg-black/80 border border-red-500/30 rounded-lg p-6 md:p-8 backdrop-blur-sm"
            >
              <h2
                className="text-2xl md:text-3xl font-bold text-white mb-6 uppercase tracking-wider"
                style={{ fontFamily: "var(--font-orbitron)" }}
              >
                Send Us a Message
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-gray-400 text-sm mb-2 uppercase tracking-wide">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full p-3 bg-black/60 border border-red-500/30 rounded-lg text-white placeholder-gray-500 focus:border-red-500 focus:outline-none transition-all"
                    placeholder="Your Name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-gray-400 text-sm mb-2 uppercase tracking-wide">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full p-3 bg-black/60 border border-red-500/30 rounded-lg text-white placeholder-gray-500 focus:border-red-500 focus:outline-none transition-all"
                    placeholder="your.email@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-gray-400 text-sm mb-2 uppercase tracking-wide">
                    Subject
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full p-3 bg-black/60 border border-red-500/30 rounded-lg text-white focus:border-red-500 focus:outline-none transition-all"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="partnership">Partnership</option>
                    <option value="feedback">Feedback</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-gray-400 text-sm mb-2 uppercase tracking-wide">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full p-3 bg-black/60 border border-red-500/30 rounded-lg text-white placeholder-gray-500 focus:border-red-500 focus:outline-none transition-all resize-none"
                    placeholder="Your message here..."
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.05 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.95 }}
                  className={`w-full p-4 rounded-lg font-bold text-white uppercase tracking-wider transition-all duration-300 ${
                    isSubmitting
                      ? "bg-gray-700 cursor-not-allowed border-2 border-gray-600"
                      : "bg-red-600 hover:bg-red-700 border-2 border-red-500"
                  }`}
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  {isSubmitting ? "Sending..." : "Send Message"}
                </motion.button>

                {submitStatus === "success" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-sm"
                  >
                    ✓ Message sent successfully! We'll get back to you soon.
                  </motion.div>
                )}

                {submitStatus === "error" && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm"
                  >
                    ✗ Something went wrong. Please try again.
                  </motion.div>
                )}
              </form>
            </motion.div>

            {/* Team Information */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="space-y-6"
            >
              {/* Team Card */}
              <div className="bg-black/80 border border-red-500/30 rounded-lg p-6 md:p-8 backdrop-blur-sm">
                <h2
                  className="text-2xl md:text-3xl font-bold text-white mb-6 uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  Team Kaju Katli
                </h2>
                <div className="mb-6">
                  <p className="text-gray-400 text-sm mb-2 uppercase tracking-wide">Event</p>
                  <p className="text-red-500 text-xl font-bold">Hack-a-Sol 4.0</p>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  We are Team Kaju Katli, participating in Hack-a-Sol 4.0. We're passionate about building innovative 
                  solutions and creating amazing experiences. Feel free to reach out to us for any inquiries, 
                  collaborations, or just to say hello!
                </p>

                {/* Social Links */}
                <div>
                  <p className="text-gray-400 text-sm mb-4 uppercase tracking-wide">Connect With Us</p>
                  <div className="flex gap-3">
                    {socialLinks.map((social) => (
                      <motion.a
                        key={social.platform}
                        href={social.url}
                        whileHover={{ scale: 1.2, rotate: 10 }}
                        whileTap={{ scale: 0.9 }}
                        className="w-12 h-12 rounded-full border-2 border-red-500/50 flex items-center justify-center text-red-400 hover:border-red-500 hover:bg-red-500/10 transition-all text-xl"
                        title={social.platform}
                      >
                        {social.icon}
                      </motion.a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-black/80 border border-red-500/30 rounded-lg p-6 md:p-8 backdrop-blur-sm">
                <h2
                  className="text-2xl font-bold text-white mb-6 uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-orbitron)" }}
                >
                  Quick Contact
                </h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="text-red-500 text-xl">📧</div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Email</p>
                      <p className="text-white text-sm">contact@kajukatli.team</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="text-red-500 text-xl">🌐</div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Website</p>
                      <p className="text-white text-sm">www.kajukatli.team</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="text-red-500 text-xl">📍</div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Location</p>
                      <p className="text-white text-sm">Hack-a-Sol 4.0</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Additional Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="bg-black/80 border border-red-500/30 rounded-lg p-6 md:p-8 backdrop-blur-sm"
          >
            <h2
              className="text-2xl font-bold text-white mb-6 uppercase tracking-wider text-center"
              style={{ fontFamily: "var(--font-orbitron)" }}
            >
              About Our Project
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">🏎️</div>
                <h3 className="text-white font-bold mb-2 uppercase tracking-wide">F1 Racing</h3>
                <p className="text-gray-400 text-sm">
                  Experience the thrill of Formula 1 racing with our immersive platform
                </p>
              </div>
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">📊</div>
                <h3 className="text-white font-bold mb-2 uppercase tracking-wide">Real-Time Data</h3>
                <p className="text-gray-400 text-sm">
                  Get live telemetry, performance metrics, and race analytics
                </p>
              </div>
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">🎮</div>
                <h3 className="text-white font-bold mb-2 uppercase tracking-wide">Interactive</h3>
                <p className="text-gray-400 text-sm">
                  Engage with 3D visualizations and interactive dashboards
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <Footer />
    </div>
  )
}

