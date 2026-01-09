"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/types"

type UserProfile = Database['public']['Tables']['users']['Row']

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signUp: (email: string, password: string, nickname: string, referralCode?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null

    // Safety timeout - force loading to false after 3 seconds to prevent stuck loading
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.warn('Auth loading timeout - forcing loading to false')
        setLoading(false)
      }
    }, 3000)

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return
      
      if (error) {
        console.error('Error getting session:', error)
        setLoading(false)
        if (timeoutId) clearTimeout(timeoutId)
        return
      }
      
      setUser(session?.user ?? null)
      if (session?.user) {
        loadProfile(session.user.id).finally(() => {
          if (isMounted && timeoutId) {
            clearTimeout(timeoutId)
          }
        })
      } else {
        setLoading(false)
        if (timeoutId) clearTimeout(timeoutId)
      }
    }).catch((err) => {
      if (isMounted) {
        console.error('Error in getSession:', err)
        setLoading(false)
        if (timeoutId) clearTimeout(timeoutId)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      
      setUser(session?.user ?? null)
      if (session?.user) {
        try {
          await loadProfile(session.user.id)
        } catch (error) {
          // Error already handled in loadProfile
          setLoading(false)
        }
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const loadProfile = async (userId: string) => {
    try {
      if (!userId) {
        console.warn('loadProfile called without userId')
        setLoading(false)
        return
      }

      // Simple query - no retry, no complex timeout logic
      // Supabase has its own timeout, and we have safety timeout in useEffect
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Check if it's a "not found" error
        const isNotFound = 
          error.code === 'PGRST116' || 
          error.code === '42P01' ||
          error.message?.toLowerCase().includes('no rows') || 
          error.message?.toLowerCase().includes('not found') ||
          error.message?.toLowerCase().includes('does not exist')

        if (isNotFound) {
          setProfile(null)
          setLoading(false)
          return
        }

        // For other errors, log but don't block UI
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error loading profile:', error.message || error.code)
        }
        setProfile(null)
        setLoading(false)
        return
      }

      // Successfully loaded profile
      if (data) {
        setProfile(data)
      } else {
        setProfile(null)
      }
      setLoading(false)
    } catch (error: any) {
      // Handle all errors gracefully - don't block UI
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error loading profile (non-blocking):', error?.message || error)
      }
      setProfile(null)
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, nickname: string, referralCode?: string) => {
    try {
      // Generate referral code
      const newReferralCode = generateReferralCode()

      // Sign up user (without email confirmation)
      // Note: Email confirmation must be disabled in Supabase Dashboard
      // Go to: Authentication > Settings > Email Auth > Confirm email: OFF
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
        },
      })

      if (authError) return { error: authError }

      if (!authData.user) return { error: { message: 'Failed to create user' } }

      // Get referrer if referral code provided
      let referrerId: string | null = null
      if (referralCode) {
        const { data: referrer } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', referralCode)
          .single()

        if (referrer) {
          referrerId = referrer.id
        }
      }

      // Create user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          nickname,
          referral_code: newReferralCode,
          referred_by: referrerId,
        })
        .select()
        .single()

      if (profileError) {
        console.error('Error creating profile:', profileError)
        return { error: profileError }
      }

      // Verify profile was created
      if (!profileData) {
        console.error('Profile data is null after insert')
        return { error: { message: 'Failed to create user profile' } }
      }

      // Create referral record if referred and automatically give reward
      if (referrerId) {
        const rewardAmount = 1 // 1 ZENTRA per referral
        const zentraPrice = 0.5
        const usdValue = rewardAmount * zentraPrice

        // Create referral record
        await supabase
          .from('referrals')
          .insert({
            referrer_id: referrerId,
            referred_id: authData.user.id,
            reward_amount: rewardAmount,
            status: 'completed',
          })

        // Automatically update referrer's balance
        const { data: existingBalance } = await supabase
          .from('balances')
          .select('*')
          .eq('user_id', referrerId)
          .eq('token', 'ZENTRA')
          .single()

        if (existingBalance) {
          // Update existing balance
          await supabase
            .from('balances')
            .update({ balance: existingBalance.balance + rewardAmount })
            .eq('id', existingBalance.id)
        } else {
          // Create new balance
          await supabase
            .from('balances')
            .insert({
              user_id: referrerId,
              token: 'ZENTRA',
              balance: rewardAmount,
            })
        }

        // Create transaction record for referrer
        await supabase
          .from('transactions')
          .insert({
            user_id: referrerId,
            type: 'referral_reward',
            token: 'ZENTRA',
            amount: rewardAmount,
            usd_value: usdValue,
            status: 'confirmed',
          })
        
        // Trigger transaction update event for real-time activity
        window.dispatchEvent(new Event('transaction-updated'))
      }

      // Give 32 Zentra tokens as welcome bonus
      const zentraPrice = 0.5 // $0.5 per token
      const zentraAmount = 32
      const zentraUsdValue = zentraAmount * zentraPrice

      // Create balance for Zentra token
      await supabase
        .from('balances')
        .insert({
          user_id: authData.user.id,
          token: 'ZENTRA',
          balance: zentraAmount,
        })

      // Create initial balances for other tokens (0 balance)
      const otherTokens = ['BTC', 'ETH', 'USDT', 'SOL']
      for (const token of otherTokens) {
        await supabase
          .from('balances')
          .insert({
            user_id: authData.user.id,
            token,
            balance: 0,
          })
      }

      // Create transaction record for welcome bonus
      await supabase
        .from('transactions')
        .insert({
          user_id: authData.user.id,
          type: 'airdrop',
          token: 'ZENTRA',
          amount: zentraAmount,
          usd_value: zentraUsdValue,
          status: 'confirmed',
        })

      // Set profile immediately from the created data
      if (profileData) {
        setProfile(profileData)
      }

      // Also try to load profile from database to ensure consistency
      // Wait a bit to ensure all database operations are complete
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // Load profile to ensure it's properly loaded
      try {
        await loadProfile(authData.user.id)
      } catch (loadError) {
        // If loadProfile fails but we have profileData, continue
        // The profile was already set above
        if (process.env.NODE_ENV === 'development') {
          console.warn('Error loading profile after signup, but profile was created:', loadError)
        }
      }

      return { error: null }
    } catch (error: any) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    try {
      // Clear profile state first to prevent UI flicker
      setProfile(null)
      
      // Clear all Supabase sessions with timeout protection
      const signOutPromise = supabase.auth.signOut()
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Sign out timeout')), 8000)
      })
      
      await Promise.race([signOutPromise, timeoutPromise])
      
      // Ensure user state is cleared
      setUser(null)
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        // Clear session storage
        sessionStorage.clear()
        // Note: We keep referral_code in localStorage for next signup
      }
    } catch (error) {
      console.error('Error during sign out:', error)
      // Even if signOut fails, clear local state
      setUser(null)
      setProfile(null)
      throw error // Re-throw to let caller handle
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase()
}

