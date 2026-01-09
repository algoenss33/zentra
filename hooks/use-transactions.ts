"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { supabase } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import type { Database } from "@/lib/supabase/types"

type Transaction = Database['public']['Tables']['transactions']['Row']

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false) // Start with false - don't block UI
  const userIdRef = useRef<string | null>(null)
  const hasLoadedRef = useRef(false)

  const loadTransactions = useCallback(async (showLoading: boolean = false) => {
    if (!user) return

    if (showLoading && !hasLoadedRef.current) {
      setLoading(true)
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .neq('type', 'send') // Exclude 'send' transactions from activity - only show popup notification
        .order('created_at', { ascending: false })
        .limit(50) // Increased limit to show more transactions

      if (error) throw error
      
      if (data) {
        setTransactions(data || [])
        hasLoadedRef.current = true
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
      // Keep existing transactions on error
    } finally {
      if (showLoading || !hasLoadedRef.current) {
        setLoading(false)
      }
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      // Only clear transactions when user becomes null
      if (userIdRef.current !== null) {
        setTransactions([])
        setLoading(false)
        hasLoadedRef.current = false
        userIdRef.current = null
      }
      return
    }

    // If user ID hasn't changed and we've already loaded, don't reload
    const isSameUser = userIdRef.current === user.id
    userIdRef.current = user.id

    // Only load if we haven't loaded yet or it's a different user
    if (!isSameUser || !hasLoadedRef.current) {
      loadTransactions(!hasLoadedRef.current)
    }

    // Listen for transaction-updated events (triggered after task/referral completion)
    const handleTransactionUpdate = () => {
      // Reload transactions immediately when event is triggered
      loadTransactions(false)
    }

    window.addEventListener('transaction-updated', handleTransactionUpdate)

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`transactions-changes-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Update in background without showing loading
          console.log('Transaction real-time update:', payload.eventType)
          // Immediately reload transactions when new one is inserted
          loadTransactions(false)
        }
      )
      .subscribe()

    return () => {
      try {
        supabase.removeChannel(channel).catch(() => {
          // Silently handle channel removal errors during cleanup
        })
        window.removeEventListener('transaction-updated', handleTransactionUpdate)
      } catch (error) {
        // Silently handle errors
      }
    }
  }, [user, loadTransactions])

  return {
    transactions,
    loading,
  }
}



