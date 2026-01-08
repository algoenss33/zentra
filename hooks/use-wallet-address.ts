"use client"

import { useState, useEffect, useMemo } from "react"
import { useAuth } from "@/contexts/auth-context"
import { generateWalletAddress } from "@/lib/wallet-utils"

export function useWalletAddress() {
  const { user } = useAuth()
  
  // Generate address directly from list - no database call needed
  const address = useMemo(() => {
    if (!user) return null
    return generateWalletAddress(user.id)
  }, [user?.id])

  return {
    address,
    loading: false, // No loading needed - address is instantly available
    error: null,
    refreshAddress: () => {} // No refresh needed - address is deterministic
  }
}

