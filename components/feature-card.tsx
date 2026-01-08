"use client"

import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import { useState } from "react"

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

export function FeatureCard({
  feature: { icon: Icon, title, description },
  index,
}: { feature: Feature; index: number }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1]
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -8, scale: 1.02 }}
      className="glass p-6 rounded-2xl transition-all duration-300 cursor-pointer relative overflow-hidden group backdrop-blur-xl border border-white/10"
    >
      {/* Gradient overlay - always visible */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#22c55e]/30 via-[#ef4444]/30 to-[#3b82f6]/30 opacity-100"
      />
      
      <motion.div
        className="mb-4 inline-block p-3 rounded-xl transition-all duration-300 relative z-10"
        animate={{
          backgroundColor: isHovered 
            ? "rgba(34, 197, 94, 0.2)" 
            : "rgba(255, 255, 255, 0.05)",
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.div
          animate={{ 
            rotate: isHovered ? [0, -10, 10, -10, 0] : 0,
          }}
          transition={{ duration: 0.5 }}
        >
          <Icon className="w-6 h-6 text-[#22c55e]" />
        </motion.div>
      </motion.div>
      
      <h3 className="text-xl font-bold mb-2 relative z-10 text-white">{title}</h3>
      <p className="text-gray-300 text-sm leading-relaxed relative z-10">{description}</p>
      
      {/* Shine effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"
        initial={false}
      />
    </motion.div>
  )
}
