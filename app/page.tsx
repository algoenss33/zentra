"use client"

import { Suspense, useEffect, useState } from "react"
import { LandingPage } from "@/components/landing-page"
import { WalletDashboard } from "@/components/wallet-dashboard"
import { MobileWallet } from "@/components/mobile-wallet"
import { useAuth } from "@/contexts/auth-context"
import { Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

function HomeContent() {
  const { user, loading } = useAuth()
  const searchParams = useSearchParams()
  const [isMobile, setIsMobile] = useState(false)
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    // Store referral code from URL if present
    const refCode = searchParams.get('ref')
    if (refCode) {
      localStorage.setItem('referral_code', refCode)
    }
  }, [searchParams])

  useEffect(() => {
    // Detect mobile and screen size
    const checkMobile = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      setScreenSize({ width, height })
      setIsMobile(width <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [])

  if (loading) {
    return (
      <div 
        className="flex items-center justify-center bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d] relative overflow-hidden" 
        style={{ 
          height: '100dvh', 
          width: '100vw',
          minHeight: '100dvh'
        }}
      >
        {/* Ambient gradient blobs */}
        <div className="absolute -top-24 -left-20 w-64 h-64 bg-[#7c5dff]/30 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-16 -right-12 w-56 h-56 bg-[#ff4d8f]/25 blur-[110px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#12d6ff]/10 blur-[140px] pointer-events-none" />
        <Loader2 className="w-8 h-8 animate-spin text-white relative z-10" />
      </div>
    )
  }

  if (!user) {
    return <LandingPage />
  }

  // Use mobile wallet for mobile-first design - Full screen viewport with responsive sizing
  const maxWidth = isMobile ? '100%' : '390px'
  const containerStyle = {
    height: '100dvh',
    maxHeight: '100dvh',
    width: '100vw',
    maxWidth: maxWidth,
    overflow: 'hidden',
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    margin: isMobile ? '0' : '0 auto',
  }

  return (
    <div 
      className="bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d] relative overflow-hidden"
      style={{ 
        minHeight: '100dvh',
        width: '100vw',
        height: '100dvh'
      }}
    >
      {/* Ambient gradient blobs for outer background */}
      <div className="fixed -top-24 -left-20 w-96 h-96 bg-[#7c5dff]/20 blur-[140px] pointer-events-none z-0" />
      <div className="fixed -bottom-16 -right-12 w-80 h-80 bg-[#ff4d8f]/15 blur-[130px] pointer-events-none z-0" />
      <div className="fixed top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#12d6ff]/8 blur-[150px] pointer-events-none z-0" />
      
      <div style={containerStyle} className="relative z-10">
        <MobileWallet />
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div 
        className="flex items-center justify-center bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d] relative overflow-hidden" 
        style={{ 
          height: '100dvh', 
          width: '100vw',
          minHeight: '100dvh'
        }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-white relative z-10" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}
