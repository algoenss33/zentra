"use client"

import { useState, useCallback, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { SignUpForm } from "./sign-up-form"
import { LoginForm } from "./login-form"
import Image from "next/image"

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultMode?: "signup" | "login"
}

export function AuthModal({ open, onOpenChange, defaultMode = "signup" }: AuthModalProps) {
  const [mode, setMode] = useState<"signup" | "login">(defaultMode)

  // Sync mode with defaultMode when modal opens
  useEffect(() => {
    if (open) {
      setMode(defaultMode)
    }
  }, [open, defaultMode])

  const handleSuccess = useCallback(() => {
    onOpenChange(false)
    setMode(defaultMode)
  }, [onOpenChange, defaultMode])

  const handleSwitchToLogin = useCallback(() => {
    setMode("login")
  }, [])

  const handleSwitchToSignUp = useCallback(() => {
    setMode("signup")
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d] border-white/10 text-white overflow-hidden relative backdrop-blur-xl">
        {/* Ambient gradient blobs matching logo colors */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#22c55e]/20 blur-[80px] pointer-events-none animate-pulse" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#ef4444]/20 blur-[80px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-[#3b82f6]/20 blur-[80px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />
        
        <DialogHeader className="relative z-10 pb-2">
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-14 h-14">
              <Image
                src="/zentra.png"
                alt="Zentra Logo"
                width={56}
                height={56}
                className="object-contain drop-shadow-[0_0_20px_rgba(34,197,94,0.5)]"
                priority
              />
            </div>
          </div>
          <DialogTitle className="text-3xl font-extrabold text-center bg-gradient-to-r from-[#22c55e] via-[#ef4444] to-[#3b82f6] bg-clip-text text-transparent mb-2">
            {mode === "signup" ? "Create Account" : "Welcome Back"}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 text-sm mt-1">
            {mode === "signup"
              ? "Create your Zentra Wallet account to get started"
              : "Sign in to your Zentra Wallet account"}
          </DialogDescription>
        </DialogHeader>
        <div className="relative z-10 pt-2 max-h-[75vh] overflow-y-auto px-1">
          {mode === "signup" ? (
            <SignUpForm
              onSuccess={handleSuccess}
              onSwitchToLogin={handleSwitchToLogin}
            />
          ) : (
            <LoginForm
              onSuccess={handleSuccess}
              onSwitchToSignUp={handleSwitchToSignUp}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}



