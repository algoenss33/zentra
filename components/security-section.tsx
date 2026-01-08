"use client"

import { motion } from "framer-motion"
import { Shield, Lock, Key, CheckCircle, AlertCircle, Eye } from "lucide-react"
import { useState } from "react"
import { GradientBackground } from "./gradient-background"

export function SecuritySection() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null)
  const [hoveredBadge, setHoveredBadge] = useState<number | null>(null)

  const securityFeatures = [
    {
      icon: Lock,
      title: "Encrypted Private Keys",
      description:
        "Your private keys are encrypted with military-grade AES-256 encryption. Only you hold the decryption key, ensuring absolute security.",
      highlight: "Client-Side Encryption",
    },
    {
      icon: Key,
      title: "Non-Custodial Wallet",
      description:
        "You own your assets. Zentra never stores, holds, or has access to your private keys or funds. Complete self-custody.",
      highlight: "Self-Custody",
    },
    {
      icon: Eye,
      title: "Transparent Security",
      description:
        "Open-source architecture and third-party audits ensure our security practices are transparent and verifiable.",
      highlight: "Audited Code",
    },
  ]

  const whyZentra = [
    {
      icon: Shield,
      title: "User-Owned Assets",
      description: "You have complete control and ownership of your digital assets at all times",
    },
    {
      icon: AlertCircle,
      title: "Zero Intermediaries",
      description: "No third-party custody means no counterparty risk and reduced attack surface",
    },
    {
      icon: CheckCircle,
      title: "Verifiable Security",
      description: "All security measures are audited by leading blockchain security firms",
    },
  ]

  const trustBadges = [
    { name: "SOC 2 Type II", subtitle: "Compliance Certified" },
    { name: "OpenZeppelin", subtitle: "Security Audit" },
    { name: "CertiK", subtitle: "Smart Contract Audit" },
    { name: "OWASP", subtitle: "Secure Development" },
  ]

  return (
    <div className="relative min-h-screen bg-background py-20">
      <GradientBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="gradient-text">Security First</span>
            <br />
            Design
          </h1>
          <p className="text-lg text-text-muted max-w-2xl mx-auto">
            Your crypto, fully encrypted and under your control. Built on principles of transparency, security, and
            self-sovereignty.
          </p>
        </motion.div>

        {/* Security Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass p-8 rounded-xl transition-all duration-300 cursor-pointer"
                style={{
                  borderColor: hoveredCard === index ? "rgba(0, 240, 255, 0.5)" : "rgba(0, 240, 255, 0.2)",
                }}
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className="mb-4 inline-block p-3 rounded-lg transition-opacity"
                  style={{
                    backgroundColor: "rgba(0, 240, 255, 0.1)",
                    opacity: hoveredCard === index ? 1 : 0.7,
                  }}
                >
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-2">{feature.title}</h3>
                <p className="text-text-muted mb-4 text-sm leading-relaxed">{feature.description}</p>
                <div
                  className="inline-block px-3 py-1 rounded-full text-primary text-xs font-mono"
                  style={{
                    backgroundColor: "rgba(0, 240, 255, 0.1)",
                  }}
                >
                  {feature.highlight}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Why Zentra */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass p-12 rounded-xl mb-20"
        >
          <h2 className="text-3xl font-bold mb-12">Why Choose Zentra</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {whyZentra.map((item, index) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                >
                  <div className="flex gap-4 items-start">
                    <div className="flex-shrink-0">
                      <div
                        className="flex items-center justify-center h-12 w-12 rounded-lg"
                        style={{
                          backgroundColor: "rgba(0, 240, 255, 0.2)",
                        }}
                      >
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold mb-2">{item.title}</h3>
                      <p className="text-text-muted text-sm">{item.description}</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </motion.div>

        {/* Trust & Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold mb-2">Trusted by Security Leaders</h2>
          <p className="text-text-muted mb-12">
            Our platform is backed by industry-leading security audits and certifications
          </p>

          <div className="grid md:grid-cols-4 gap-4">
            {trustBadges.map((badge, index) => (
              <motion.div
                key={index}
                whileHover={{ y: -4 }}
                className="glass p-6 rounded-lg text-center transition-all cursor-pointer"
                style={{
                  borderColor: hoveredBadge === index ? "rgba(0, 240, 255, 0.5)" : "rgba(0, 240, 255, 0.2)",
                }}
                onMouseEnter={() => setHoveredBadge(index)}
                onMouseLeave={() => setHoveredBadge(null)}
              >
                <div
                  className="w-12 h-12 rounded-full mx-auto mb-4 flex items-center justify-center transition-all"
                  style={{
                    background: "linear-gradient(135deg, #00f0ff 0%, #7c3aed 50%, #06b6d4 100%)",
                    boxShadow:
                      hoveredBadge === index ? "0 0 20px rgba(0, 240, 255, 0.8)" : "0 0 20px rgba(0, 240, 255, 0.5)",
                  }}
                >
                  <CheckCircle className="w-6 h-6 text-background" />
                </div>
                <p className="font-bold text-sm mb-1">{badge.name}</p>
                <p className="text-xs text-text-muted">{badge.subtitle}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Security Checklist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-20 glass p-12 rounded-xl"
        >
          <h2 className="text-3xl font-bold mb-8">Security Checklist</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              "Private key never leaves your device",
              "AES-256 encryption for all data",
              "Hardware wallet integration support",
              "Multi-factor authentication enabled",
              "Regular security audits",
              "Zero-knowledge architecture",
              "Secure enclave support",
              "Biometric protection options",
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.05 }}
                className="flex items-center gap-3"
              >
                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-text-muted">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
