"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import type { Database } from "@/lib/supabase/types"

type Balance = Database['public']['Tables']['balances']['Row']

const ZENTRA_PRICE = 0.5 // $0.5 per Zentra token

export function useBalance() {
  const { user } = useAuth()
  const [balances, setBalances] = useState<Balance[]>([])
  const [loading, setLoading] = useState(false) // Start with false - don't block UI
  const userIdRef = useRef<string | null>(null) // Track user ID to prevent unnecessary clears

  // CRITICAL FIX: Use useCallback to stabilize loadBalances function
  // This prevents the effect from re-running unnecessarily and preserves balances
  const loadBalances = useCallback(async (showLoading: boolean = false, retryCount: number = 0) => {
    if (!user) return

    const MAX_RETRIES = 3
    const RETRY_DELAYS = [1000, 2000, 3000] // Exponential backoff delays in ms

    if (showLoading && retryCount === 0) {
      setLoading(true)
    }

    try {
      // Simple query without aggressive timeout - Supabase has its own timeout
      const { data, error } = await supabase
        .from('balances')
        .select('*')
        .eq('user_id', user.id)
        .order('token', { ascending: true })

      if (error) {
        // Only log if it's not a common/expected error
        if (error.code !== 'PGRST116' && error.message !== 'cancelled') {
          console.warn('Error loading balances:', error.message)
        }
        
        // Retry if we haven't exceeded max retries
        if (retryCount < MAX_RETRIES) {
          const delay = RETRY_DELAYS[retryCount] || 3000
          console.log(`Retrying balance load (attempt ${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms...`)
          
          setTimeout(() => {
            loadBalances(showLoading, retryCount + 1)
          }, delay)
          return
        }
        
        // CRITICAL FIX: Keep existing balances on error after max retries
        // Don't clear balances - preserve what we have
        setLoading(false)
        return
      }
      
      // CRITICAL FIX: Only update balances if we successfully fetched data
      // This prevents clearing balances on failed requests
      if (data) {
        setBalances(data as Balance[])
      }
      
      // Log for debugging (only in dev)
      if (process.env.NODE_ENV === 'development' && data && data.length > 0) {
        const balancesData = data as Balance[]
        const zentraBalance = balancesData.find((b) => b.token === 'ZENTRA')
        if (zentraBalance) {
          console.log('ZENTRA Balance loaded:', zentraBalance.balance)
        }
      }
    } catch (error) {
      // Retry on catch error too
      if (retryCount < MAX_RETRIES) {
        const delay = RETRY_DELAYS[retryCount] || 3000
        console.log(`Retrying balance load after error (attempt ${retryCount + 1}/${MAX_RETRIES}) after ${delay}ms...`)
        
        setTimeout(() => {
          loadBalances(showLoading, retryCount + 1)
        }, delay)
        return
      }
      
      // CRITICAL FIX: Silently handle errors after max retries
      // Keep existing balances, don't clear them - this prevents balance from becoming 0
      if (process.env.NODE_ENV === 'development') {
        console.warn('Error loading balances after retries (keeping existing data):', error)
      }
    } finally {
      // Always set loading to false when done (whether success or failure)
      if (showLoading || retryCount === 0) {
        setLoading(false)
      }
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      // Only clear balances when user becomes null
      if (userIdRef.current !== null) {
        setBalances([])
        setLoading(false)
        userIdRef.current = null
      }
      return
    }

    // If user ID hasn't changed, don't clear balances - just refresh them
    const isSameUser = userIdRef.current === user.id
    userIdRef.current = user.id

    // CRITICAL FIX: Only clear balances if this is a different user
    // Never clear balances for the same user - this prevents balance from becoming 0
    if (!isSameUser) {
      // Different user - but don't clear immediately to prevent flash of 0 balance
      // Balance will be replaced when new data loads
      setLoading(true)
    }

    // CRITICAL FIX: Always load balances, but don't clear existing ones
    // This ensures balance is always up-to-date without causing it to flash to 0
    loadBalances()

    // Subscribe to real-time updates with error handling
    let channel: ReturnType<typeof supabase.channel> | null = null
    let pollInterval: NodeJS.Timeout | null = null
    let isCleaningUp = false // Flag to prevent false positive warnings during cleanup
    
    // Listen for custom balance update events
    const handleBalanceUpdate = () => {
      console.log('Balance update event received')
      // Update in background without setting loading
      loadBalances(false)
    }
    
    window.addEventListener('balance-updated', handleBalanceUpdate)

    // Setup real-time subscription with fallback
    const setupRealtimeSubscription = () => {
      try {
        channel = supabase
          .channel(`balances-changes-${user.id}-${Date.now()}`) // Unique channel name
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'balances',
              filter: `user_id=eq.${user.id}`,
            },
            (payload) => {
              console.log('Balance changed:', payload)
              // Update in background without setting loading
              loadBalances(false)
            }
          )
          .subscribe((status) => {
            // Don't log warnings if we're cleaning up (prevents false positives)
            if (isCleaningUp) return
            
            if (status === 'SUBSCRIBED') {
              console.log('Balance real-time subscription active')
              // Clear polling if real-time works
              if (pollInterval) {
                clearInterval(pollInterval)
                pollInterval = null
              }
            } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
              // Only warn for actual errors, not CLOSED status (which happens during cleanup)
              console.warn('Balance real-time subscription failed, using polling fallback')
              // Fallback to polling if real-time fails
              if (!pollInterval && !isCleaningUp) {
                pollInterval = setInterval(() => {
                  loadBalances(false)
                }, 30000) // Poll every 30 seconds
              }
            } else if (status === 'CLOSED') {
              // CLOSED status is normal during cleanup, don't warn
              // Only setup polling if not cleaning up and real-time was working before
              if (!pollInterval && !isCleaningUp) {
                pollInterval = setInterval(() => {
                  loadBalances(false)
                }, 30000) // Poll every 30 seconds
              }
            }
          })
      } catch (error) {
        if (!isCleaningUp) {
          console.warn('Failed to setup real-time subscription, using polling:', error)
        }
        // Fallback: poll for updates every 30 seconds if real-time fails
        if (!pollInterval && !isCleaningUp) {
          pollInterval = setInterval(() => {
            loadBalances(false)
          }, 30000)
        }
      }
    }

    // Setup subscription
    setupRealtimeSubscription()

    return () => {
      // Mark as cleaning up to prevent false positive warnings
      isCleaningUp = true
      
      // Safely remove channel with error handling
      if (channel) {
        try {
          // Check if channel is still valid before removing
          const channelState = (channel as any).state
          if (channelState && channelState !== 'closed') {
            supabase.removeChannel(channel).catch((err) => {
              // Silently handle channel removal errors during cleanup
              // Don't log during cleanup as it's expected behavior
            })
          }
        } catch (error) {
          // Silently handle channel removal errors during cleanup
        }
      }
      // Clear polling interval if exists
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
      window.removeEventListener('balance-updated', handleBalanceUpdate)
    }
  }, [user]) // Only depend on user, not loadBalances to prevent unnecessary re-runs

  const getBalance = (token: string): number => {
    const balance = balances.find(b => b.token === token)
    return balance?.balance || 0
  }

  const getTotalPortfolioValue = (): number => {
    let total = 0
    balances.forEach(balance => {
      if (balance.token === 'ZENTRA') {
        total += balance.balance * ZENTRA_PRICE
      }
      // Other tokens would use real-time prices, but for now they're 0
    })
    return total
  }

  const getZentraBalance = (): number => {
    return getBalance('ZENTRA')
  }

  const getZentraValue = (): number => {
    return getZentraBalance() * ZENTRA_PRICE
  }

  const reloadBalances = async () => {
    await loadBalances(false) // Reload without showing loading state
  }

  return {
    balances,
    loading,
    getBalance,
    getTotalPortfolioValue,
    getZentraBalance,
    getZentraValue,
    zentraPrice: ZENTRA_PRICE,
    reloadBalances,
  }
}



