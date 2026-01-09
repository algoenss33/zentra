"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Copy, Users, Gift } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Database } from "@/lib/supabase/types"

type Referral = Database['public']['Tables']['referrals']['Row']

export function ReferralSection() {
  const { profile } = useAuth()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(false) // Start with false - don't block UI
  const [referralCode, setReferralCode] = useState("")

  const loadReferrals = useCallback(async (showLoading: boolean = false) => {
    if (!profile) return

    if (showLoading) {
      setLoading(true)
    }

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('referrer_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setReferrals(data || [])
      }
    } catch (error: any) {
      console.error('Error loading referrals:', error)
      // Don't show toast on error - keep existing data
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [profile])

  useEffect(() => {
    if (!profile) {
      setReferrals([])
      return
    }

    setReferralCode(profile.referral_code)
    // Load referrals on mount
    loadReferrals(true)

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`referrals-changes-${profile.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'referrals',
          filter: `referrer_id=eq.${profile.id}`,
        },
        () => {
          // Update in background without showing loading
          loadReferrals(false)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel).catch(() => {
        // Silently handle channel removal errors during cleanup
      })
    }
  }, [profile, loadReferrals])

  const copyReferralCode = () => {
    const fullUrl = `${window.location.origin}?ref=${referralCode}`
    navigator.clipboard.writeText(fullUrl)
    toast.success("Referral link copied to clipboard!")
  }

  const totalRewards = referrals.reduce((sum, ref) => sum + (ref.reward_amount || 0), 0)
  const completedReferrals = referrals.filter(ref => ref.status === 'completed').length

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-lg"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Referral Program
        </h3>

        <div className="space-y-4">
          <div>
            <Label>Your Referral Code</Label>
            <div className="flex gap-2 mt-2">
              <Input value={referralCode} readOnly className="font-mono" />
              <Button onClick={copyReferralCode} variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-sm text-text-muted mt-2">
              Share this code with friends to earn rewards!
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{completedReferrals}</div>
              <div className="text-sm text-text-muted">Total Referrals</div>
            </div>
            <div className="text-center p-4 bg-background/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{totalRewards}</div>
              <div className="text-sm text-text-muted">Total Rewards</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass p-6 rounded-lg"
      >
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Gift className="w-4 h-4" />
          Referral History
        </h4>
        {loading ? (
          <div className="text-center py-8 text-text-muted">Loading...</div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            No referrals yet. Start sharing your code!
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
              >
                <div>
                  <div className="font-medium">Referral #{referral.id.slice(0, 8)}</div>
                  <div className="text-sm text-text-muted">
                    {new Date(referral.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{referral.reward_amount} tokens</div>
                  <div
                    className={`text-xs ${
                      referral.status === 'completed' ? 'text-green-500' : 'text-yellow-500'
                    }`}
                  >
                    {referral.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}



