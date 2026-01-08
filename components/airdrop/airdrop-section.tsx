"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Gift, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Database } from "@/lib/supabase/types"

type Airdrop = Database['public']['Tables']['airdrops']['Row']

export function AirdropSection() {
  const { profile } = useAuth()
  const [airdrops, setAirdrops] = useState<Airdrop[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      // Load airdrops on mount/refresh
      const initializeData = async () => {
        await loadAirdrops()
        
        // After initial load, trigger balance update to ensure sync
        setTimeout(() => {
          window.dispatchEvent(new Event('balance-updated'))
        }, 500)
      }
      
      initializeData()

      // Listen for balance updates to reload airdrops if needed
      const handleBalanceUpdate = () => {
        // Reload airdrops in background to ensure sync
        loadAirdrops()
      }
      
      window.addEventListener('balance-updated', handleBalanceUpdate)

      return () => {
        window.removeEventListener('balance-updated', handleBalanceUpdate)
      }
    }
  }, [profile])

  const loadAirdrops = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('airdrops')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAirdrops(data || [])
    } catch (error: any) {
      console.error('Error loading airdrops:', error)
      toast.error('Failed to load airdrops')
    } finally {
      setLoading(false)
    }
  }

  const claimAirdrop = async (airdropId: string) => {
    if (!profile) return

    try {
      const airdrop = airdrops.find(a => a.id === airdropId)
      if (!airdrop) return

      // Update airdrop status
      const { error: airdropError } = await (supabase
        .from('airdrops') as any)
        .update({
          status: 'claimed',
          claimed_at: new Date().toISOString(),
        })
        .eq('id', airdropId)

      if (airdropError) throw airdropError

      // Calculate USD value
      const token = airdrop.token
      const amount = airdrop.amount
      const tokenPrice = token === 'ZENTRA' ? 0.5 : 0 // Only Zentra has price for now
      const usdValue = amount * tokenPrice

      // Get or create balance
      const { data: existingBalance } = await (supabase
        .from('balances') as any)
        .select('*')
        .eq('user_id', profile.id)
        .eq('token', token)
        .single()

      if (existingBalance) {
        // Update existing balance
        await (supabase
          .from('balances') as any)
          .update({ balance: existingBalance.balance + amount })
          .eq('id', existingBalance.id)
      } else {
        // Create new balance
        await (supabase
          .from('balances') as any)
          .insert({
            user_id: profile.id,
            token,
            balance: amount,
          })
      }

      // Create transaction record
      await (supabase
        .from('transactions') as any)
        .insert({
          user_id: profile.id,
          type: 'airdrop',
          token,
          amount,
          usd_value: usdValue,
          status: 'confirmed',
        })

      toast.success(`Airdrop claimed successfully! You received ${amount} ${token}.`)
      
      // Reload airdrops to get actual data from database
      await loadAirdrops()
      
      // Trigger balance update event after airdrops are reloaded
      // Multiple triggers to ensure balance sync
      window.dispatchEvent(new Event('balance-updated'))
      setTimeout(() => {
        window.dispatchEvent(new Event('balance-updated'))
      }, 300)
      setTimeout(() => {
        window.dispatchEvent(new Event('balance-updated'))
      }, 1000)
    } catch (error: any) {
      console.error('Error claiming airdrop:', error)
      toast.error('Failed to claim airdrop')
    }
  }

  const pendingAirdrops = airdrops.filter(a => a.status === 'pending')
  const claimedAirdrops = airdrops.filter(a => a.status === 'claimed')
  const totalClaimed = claimedAirdrops.reduce((sum, a) => sum + (a.amount || 0), 0)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-lg"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Airdrops
        </h3>

        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="p-4 bg-background/50 rounded-lg">
            <div className="text-sm text-text-muted mb-1">Pending</div>
            <div className="text-2xl font-bold text-primary">{pendingAirdrops.length}</div>
          </div>
          <div className="p-4 bg-background/50 rounded-lg">
            <div className="text-sm text-text-muted mb-1">Total Claimed</div>
            <div className="text-2xl font-bold text-primary">{totalClaimed}</div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-text-muted">Loading...</div>
        ) : airdrops.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            No airdrops available at the moment.
          </div>
        ) : (
          <div className="space-y-3">
            {airdrops.map((airdrop) => (
              <div
                key={airdrop.id}
                className="flex items-center justify-between p-4 bg-background/50 rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {airdrop.amount} {airdrop.token}
                  </div>
                  <div className="text-sm text-text-muted">
                    {new Date(airdrop.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {airdrop.status === 'claimed' ? (
                    <span className="text-sm text-green-500">Claimed</span>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => claimAirdrop(airdrop.id)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Claim
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

