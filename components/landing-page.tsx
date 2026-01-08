"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Lock, Shield, Zap } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState, useRef, useEffect } from "react"
import { FeatureCard } from "./feature-card"

export function LandingPage() {
  const [isMobile, setIsMobile] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  // Parallax effects for sections (kept for potential future use)
  const y1 = useTransform(scrollYProgress, [0, 1], [0, -50])
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -100])

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  // Ensure container has proper position for useScroll
  useEffect(() => {
    if (containerRef.current) {
      const computedStyle = window.getComputedStyle(containerRef.current)
      if (computedStyle.position === "static") {
        containerRef.current.style.position = "relative"
      }
    }
  }, [])

  const features = [
    {
      icon: Lock,
      image: "/zentra1.png",
      title: "Encrypted Private Keys",
      description: "Your keys, your crypto. Full control with military-grade encryption.",
      color: "from-green-500 to-emerald-600",
      glow: "rgba(34, 197, 94, 0.3)",
      gradient: "from-green-500/20 via-emerald-500/10 to-transparent",
    },
    {
      icon: Shield,
      image: "/zentra2.png",
      title: "Non-Custodial Wallet",
      description: "No middleman. Self-custody puts you in complete control of your assets.",
      color: "from-red-500 to-rose-600",
      glow: "rgba(239, 68, 68, 0.3)",
      gradient: "from-red-500/20 via-rose-500/10 to-transparent",
    },
    {
      icon: Zap,
      image: "/zentra3.png",
      title: "Lightning Fast",
      description: "Experience instant transactions and real-time portfolio updates.",
      color: "from-blue-500 to-indigo-600",
      glow: "rgba(59, 130, 246, 0.3)",
      gradient: "from-blue-500/20 via-indigo-500/10 to-transparent",
    },
  ]

  // Crypto floating particles data - fewer particles on mobile for performance
  const particleCount = isMobile ? 6 : 12
  const particles = Array.from({ length: particleCount }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 3 + Math.random() * 4,
  }))

  const stats = [
    { value: "$2.5B+", label: "Assets Secured" },
    { value: "50K+", label: "Active Users" },
    { value: "10+", label: "Blockchains" },
    { value: "99.9%", label: "Uptime" },
  ]

  return (
    <div
      ref={containerRef}
      className="relative bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d] text-white"
      style={{
        position: "relative" as const,
        height: "100dvh",
        maxHeight: "100dvh",
        width: "100vw",
        overflow: "hidden",
        isolation: "isolate",
      }}
    >
      {/* Optimized Ambient gradient blobs - CSS animations for better performance */}
      <div
        className={`absolute ${isMobile ? '-top-12 -left-12 w-48 h-48 blur-[60px]' : '-top-24 -left-20 w-96 h-96 blur-[100px]'} bg-[#22c55e]/20 pointer-events-none will-change-transform`}
        style={{
          animation: isMobile ? 'none' : 'floatGlow 15s ease-in-out infinite',
        }}
      />
      <div
        className={`absolute ${isMobile ? '-bottom-8 -right-8 w-40 h-40 blur-[50px]' : '-bottom-16 -right-12 w-80 h-80 blur-[90px]'} bg-[#ef4444]/15 pointer-events-none will-change-transform`}
        style={{
          animation: isMobile ? 'none' : 'floatGlow 18s ease-in-out infinite 2s',
        }}
      />
      <div
        className={`absolute top-1/3 left-1/2 -translate-x-1/2 ${isMobile ? 'w-64 h-64 blur-[70px]' : 'w-[400px] h-[400px] blur-[110px]'} bg-[#3b82f6]/15 pointer-events-none will-change-transform`}
        style={{
          animation: isMobile ? 'none' : 'floatGlow 20s ease-in-out infinite 4s',
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="backdrop-blur-sm bg-[#0B0E11]/30 border-b border-white/5 flex-shrink-0"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-3 sm:py-4 md:py-6 flex items-center justify-between gap-2 sm:gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0"
            >
              <Image
                src="/zentra.png"
                alt="Zentra Logo"
                width={isMobile ? 32 : 40}
                height={isMobile ? 32 : 40}
                className="object-contain"
                priority
              />
            </motion.div>
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
              <Link href="/login" className={isMobile ? "min-w-[80px]" : "min-w-[90px]"}>
                <motion.button
                  className={`btn-secondary w-full ${isMobile ? 'text-xs px-4 py-2' : 'text-xs sm:text-sm'}`}
                  whileHover={{ scale: isMobile ? 1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Sign In
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.nav>

        {/* Scrollable content (no visible scrollbar) */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden">
          {/* Hero Section - Mobile Optimized */}
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 md:px-12 ${isMobile ? 'py-8 space-y-8' : 'py-10 sm:py-14 md:py-20 lg:py-28 space-y-10 sm:space-y-14'}`}>
            <motion.div
              style={{
                opacity: 1,
                y: 0,
              }}
              className={`text-center ${isMobile ? 'mb-8' : 'mb-12'}`}
            >
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className={isMobile ? "mb-4" : "mb-6"}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                  className={`inline-block ${isMobile ? 'mb-3' : 'mb-4'}`}
                >
                  <div
                    className={`relative ${isMobile ? 'w-14 h-14' : 'w-16 h-16 md:w-20 md:h-20'} will-change-transform`}
                    style={{
                      animation: isMobile ? 'none' : 'logoFloat 6s ease-in-out infinite',
                    }}
                  >
                    <Image
                      src="/zentra.png"
                      alt="Zentra Logo"
                      width={isMobile ? 56 : 80}
                      height={isMobile ? 56 : 80}
                      className="object-contain drop-shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                      priority
                    />
                  </div>
                </motion.div>
                <h1 className={`${isMobile ? 'text-3xl sm:text-4xl mb-4' : 'text-4xl sm:text-5xl md:text-7xl lg:text-8xl mb-6'} font-extrabold tracking-tight relative`}>
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="block relative will-change-transform"
                  >
                    Zentra
                    {!isMobile && (
                      <span
                        className="absolute inset-0 bg-gradient-to-r from-[#22c55e]/15 via-[#ef4444]/15 to-[#3b82f6]/15 blur-2xl will-change-opacity"
                        style={{
                          animation: 'pulseGlow 4s ease-in-out infinite',
                        }}
                      />
                    )}
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    className={`block relative ${isMobile ? 'mt-1' : 'mt-2'} will-change-transform`}
                  >
                    <span className="gradient-text bg-clip-text text-transparent bg-gradient-to-r from-[#22c55e] via-[#ef4444] to-[#3b82f6] relative z-10">
                      Wallet
                    </span>
                  </motion.span>
                </h1>
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className={`${isMobile ? 'text-base mb-6 px-2' : 'text-lg md:text-xl lg:text-2xl mb-10'} text-gray-300 max-w-3xl mx-auto leading-relaxed font-light will-change-transform`}
              >
                Your self-custodial crypto wallet with{" "}
                <span className="text-[#22c55e] font-semibold">encrypted private keys</span> and professional portfolio management.{" "}
                <span className="text-white font-medium">Take control</span> of your digital assets.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className={`flex flex-col sm:flex-row ${isMobile ? 'gap-3 mt-4' : 'gap-4 sm:gap-5 mt-6 sm:mt-8'} will-change-transform justify-center items-center`}
              >
                <Link href="/signup" className="group relative w-full sm:w-auto">
                  <motion.button
                    className={`relative w-full ${isMobile ? 'px-6 py-4 text-base' : 'px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg'} 
                               bg-gradient-to-r from-[#22c55e] via-[#3b82f6] to-[#ef4444] 
                               text-white font-bold rounded-xl
                               flex items-center justify-center
                               shadow-[0_0_30px_rgba(34,197,94,0.4)]
                               active:shadow-[0_0_50px_rgba(34,197,94,0.6)]
                               transition-all duration-500 overflow-hidden
                               ${!isMobile ? 'hover:shadow-[0_0_50px_rgba(34,197,94,0.6)]' : ''}
                               touch-manipulation min-h-[48px]`}
                    whileHover={!isMobile ? { 
                      scale: 1.05,
                      boxShadow: "0 0 60px rgba(34, 197, 94, 0.7), 0 0 100px rgba(59, 130, 246, 0.5)",
                    } : undefined}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10 font-semibold tracking-wide text-center">Create Wallet</span>
                    {!isMobile && (
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent will-change-transform"
                        style={{
                          animation: 'shimmer 3s ease-in-out infinite',
                        }}
                      />
                    )}
                  </motion.button>
                </Link>
                <Link href="/signup" className="group relative w-full sm:w-auto">
                  <motion.button
                    className={`relative w-full ${isMobile ? 'px-6 py-4 text-base' : 'px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg'} 
                               bg-white/5 backdrop-blur-xl border-2 border-white/20
                               text-white font-semibold rounded-xl
                               flex items-center justify-center
                               active:bg-white/10 active:border-white/30
                               transition-all duration-300 overflow-hidden
                               ${!isMobile ? 'hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_30px_rgba(255,255,255,0.1)]' : ''}
                               touch-manipulation min-h-[48px]`}
                    whileHover={!isMobile ? { 
                      scale: 1.05,
                      boxShadow: "0 0 30px rgba(255, 255, 255, 0.1)",
                    } : undefined}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10 text-center">Get Started</span>
                    {!isMobile && (
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent will-change-transform"
                        style={{
                          animation: 'shimmer 4s ease-in-out infinite 1s',
                        }}
                      />
                    )}
                  </motion.button>
                </Link>
              </motion.div>
            </motion.div>

            {/* Enhanced Features Grid with Images - Optimized Performance */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className={`grid md:grid-cols-3 ${isMobile ? 'gap-8 mt-12 mb-12' : 'gap-10 lg:gap-12 mt-24 md:mt-32 mb-20'} will-change-transform`}
            >
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={!isMobile ? { 
                    y: -6,
                  } : undefined}
                  whileTap={isMobile ? { scale: 0.98 } : undefined}
                  className="group relative flex flex-col will-change-transform"
                >
                  {/* Image Container - Optimized */}
                  <div
                    className={`relative ${isMobile ? 'mb-6' : 'mb-8'} overflow-hidden rounded-2xl will-change-transform transition-transform duration-500 ${!isMobile ? 'group-hover:scale-[1.03]' : ''}`}
                  >
                    {/* Subtle glow effect on hover - CSS based */}
                    {!isMobile && (
                      <div
                        className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-12 blur-2xl transition-opacity duration-500 -z-10 will-change-opacity`}
                      />
                    )}

                    {/* Main Feature Image */}
                    <div className={`relative ${isMobile ? 'aspect-[4/3]' : 'aspect-[16/10]'} w-full overflow-hidden rounded-2xl`}>
                      <Image
                        src={feature.image}
                        alt={feature.title}
                        fill
                        className="object-cover object-center transition-transform duration-500 group-hover:scale-105 will-change-transform"
                        sizes={isMobile ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
                        priority={index === 0}
                      />
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="flex-1 flex flex-col text-center">
                    <h3 
                      className={`${isMobile ? 'text-xl mb-3' : 'text-2xl lg:text-3xl mb-4'} 
                                 font-extrabold text-white
                                 transition-colors duration-300`}
                    >
                      {feature.title}
                    </h3>
                    
                    <p className={`text-gray-300 leading-relaxed ${isMobile ? 'text-sm' : 'text-base lg:text-lg'}`}>
                      {feature.description}
                    </p>

                    {/* Subtle accent line */}
                    <motion.div
                      className={`${isMobile ? 'mt-4' : 'mt-6'} flex justify-center`}
                      initial={{ opacity: 0, scaleX: 0 }}
                      whileInView={{ opacity: 1, scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 + 0.3, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <div className={`h-0.5 w-16 bg-gradient-to-r ${feature.color} rounded-full`} />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Enhanced Stats Section with animated counters - Mobile Optimized */}
            <motion.div
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className={`relative ${isMobile ? 'mt-12 mb-16' : 'mt-24 md:mt-32 mb-24 md:mb-32'}`}
            >
              {/* Background container with enhanced styling */}
              <motion.div
                className={`relative ${isMobile ? 'p-6 rounded-2xl' : 'p-8 md:p-12 rounded-3xl'} 
                           bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-white/[0.05]
                           backdrop-blur-2xl border border-white/10
                           shadow-[0_8px_32px_rgba(0,0,0,0.3)]
                           overflow-hidden`}
                whileInView={!isMobile ? {
                  boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)",
                } : undefined}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                {/* Animated gradient border - CSS based for better performance */}
                {!isMobile && (
                  <div
                    className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#22c55e]/15 via-[#3b82f6]/15 to-[#ef4444]/15 opacity-40 blur-2xl will-change-transform"
                    style={{
                      animation: 'rotateGradient 25s linear infinite',
                    }}
                  />
                )}

                {/* Grid of stats - Mobile optimized */}
                <div className={`relative z-10 grid grid-cols-2 md:grid-cols-4 ${isMobile ? 'gap-4' : 'gap-8 md:gap-12'}`}>
                  {stats.map((stat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      whileInView={{ opacity: 1, scale: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ 
                        duration: 0.6, 
                        delay: index * 0.15,
                        type: "spring",
                        stiffness: 100,
                      }}
                      whileHover={!isMobile ? { 
                        scale: 1.1,
                        y: -5,
                      } : undefined}
                      whileTap={isMobile ? { scale: 0.98 } : undefined}
                      className="text-center group relative"
                    >
                      {/* Animated glow effect on hover - desktop only */}
                      {!isMobile && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-[#22c55e]/10 via-[#3b82f6]/10 to-[#ef4444]/10 rounded-2xl opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500"
                        />
                      )}
                      
                      <motion.div
                        className={`relative ${isMobile ? 'text-2xl mb-2' : 'text-4xl md:text-5xl lg:text-6xl mb-3'} font-extrabold`}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: index * 0.15 + 0.3 }}
                      >
                        <span className="bg-gradient-to-r from-[#22c55e] via-[#ef4444] to-[#3b82f6] bg-clip-text text-transparent relative">
                          {stat.value}
                        </span>
                      </motion.div>
                      
                      <motion.div
                        className={`${isMobile ? 'text-xs mb-1' : 'text-xs md:text-sm'} text-gray-400 font-medium uppercase tracking-wider`}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: index * 0.15 + 0.5 }}
                      >
                        {stat.label}
                      </motion.div>

                      {/* Decorative underline - only on desktop */}
                      {!isMobile && (
                        <motion.div
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-[#22c55e] via-[#3b82f6] to-[#ef4444] group-hover:w-full transition-all duration-500"
                        />
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Decorative corner accents - hidden on mobile */}
                {!isMobile && (
                  <>
                    <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-[#22c55e]/10 to-transparent rounded-tl-3xl blur-2xl" />
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#ef4444]/10 to-transparent rounded-br-3xl blur-2xl" />
                  </>
                )}
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
