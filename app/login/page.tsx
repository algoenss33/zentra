"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { LoginForm } from "@/components/auth/login-form"
import Image from "next/image"
import Link from "next/link"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/")
    }
  }, [user, loading, router])

  const handleSuccess = () => {
    router.push("/")
  }

  const handleSwitchToSignUp = () => {
    router.push("/signup")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d]">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d] text-white relative overflow-hidden">
      {/* Ambient gradient blobs */}
      <div className="absolute -top-20 -right-20 w-40 h-40 md:w-60 md:h-60 bg-[#22c55e]/20 blur-[80px] pointer-events-none animate-pulse" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 md:w-60 md:h-60 bg-[#ef4444]/20 blur-[80px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute -bottom-20 -right-20 w-40 h-40 md:w-60 md:h-60 bg-[#3b82f6]/20 blur-[80px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Navigation - Minimal overlay */}
      <nav className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 sm:px-6 md:px-12 py-4 md:py-6">
        <Link href="/" className="relative w-8 h-8 sm:w-10 sm:h-10">
          <Image
            src="/zentra.png"
            alt="Zentra Logo"
            width={40}
            height={40}
            className="object-contain"
            priority
          />
        </Link>
        <Link 
          href="/" 
          className="text-xs sm:text-sm text-gray-300 hover:text-white transition-colors"
        >
          Back to Home
        </Link>
      </nav>

      {/* Main Content - Full Screen */}
      <div className="h-full w-full flex items-center justify-center px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16 md:py-20">
        <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl">
          <div className="bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d] border border-white/10 rounded-xl sm:rounded-2xl p-6 sm:p-8 md:p-10 lg:p-12 backdrop-blur-xl shadow-2xl">
            {/* Logo and Header */}
            <div className="flex flex-col items-center mb-6 sm:mb-8">
              <div className="relative w-12 h-12 sm:w-14 sm:h-14 mb-3 sm:mb-4">
                <Image
                  src="/zentra.png"
                  alt="Zentra Logo"
                  width={56}
                  height={56}
                  className="object-contain drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                  priority
                />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-center bg-gradient-to-r from-[#22c55e] via-[#ef4444] to-[#3b82f6] bg-clip-text text-transparent mb-2">
                Welcome Back
              </h1>
              <p className="text-center text-gray-400 text-xs sm:text-sm md:text-base">
                Sign in to your Zentra Wallet account
              </p>
            </div>

            {/* Login Form */}
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToSignUp={handleSwitchToSignUp}
            />
          </div>
        </div>
      </div>
    </div>
  )
}


