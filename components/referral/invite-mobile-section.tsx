"use client"

import { useState, useEffect, useCallback } from "react"
import { motion } from "framer-motion"
import { Copy, Users, Gift, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Database } from "@/lib/supabase/types"

type Referral = Database['public']['Tables']['referrals']['Row']

export function InviteMobileSection() {
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
      // Don't show error toast - keep existing data
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

  const copyCodeOnly = () => {
    navigator.clipboard.writeText(referralCode)
    toast.success("Referral code copied to clipboard!")
  }

  const totalRewards = referrals
    .filter(ref => ref.status === 'completed')
    .reduce((sum, ref) => sum + (ref.reward_amount || 0), 0)
  const completedReferrals = referrals.filter(ref => ref.status === 'completed').length

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d] text-white overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute -top-16 -left-14 w-56 h-56 bg-[#7c5dff]/25 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#5eead4]/18 blur-[110px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#22d3ee]/12 blur-[120px] pointer-events-none" />

      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="px-4 pt-8 pb-4 bg-black/20 backdrop-blur-xl flex-shrink-0 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold mb-1">Invite Friends</h2>
            <p className="text-sm text-gray-300">Earn 1 ZENTRA for each person you invite</p>
          </div>
        </div>

        {/* Content - Scrollable without scrollbar */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 space-y-4 pb-6" style={{ 
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}>
          <div className="bg-gradient-to-r from-[#22d3ee] via-[#6366f1] to-[#a855f7] rounded-xl p-4 shadow-[0_12px_35px_rgba(34,211,238,0.35)] border border-white/15">
            <div className="text-white mb-3">
              <div className="text-xs opacity-90 mb-1">Total Earned</div>
              <div className="text-2xl font-bold">{totalRewards} ZENTRA</div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div className="bg-white/15 rounded-lg p-2 backdrop-blur-sm border border-white/10">
                <div className="text-white text-lg font-bold">{completedReferrals}</div>
                <div className="text-white/90 text-xs">Total Referrals</div>
              </div>
              <div className="bg-white/15 rounded-lg p-2 backdrop-blur-sm border border-white/10">
                <div className="text-white text-lg font-bold">{referrals.length}</div>
                <div className="text-white/90 text-xs">All Time</div>
              </div>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.28)] border border-white/10 backdrop-blur-lg">
            <div className="mb-3">
              <div className="text-sm font-semibold text-white mb-2">Your Referral Code</div>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 border border-white/10">
                  <div className="text-xs text-gray-300 mb-1">Code</div>
                  <div className="font-mono font-semibold text-white">{referralCode}</div>
                </div>
                <Button
                  onClick={copyCodeOnly}
                  size="sm"
                  className="flex-shrink-0 bg-gradient-to-r from-[#7c5dff] via-[#5eead4] to-[#22d3ee] text-white border-0 shadow-[0_8px_20px_rgba(124,93,255,0.35)] hover:shadow-[0_10px_24px_rgba(124,93,255,0.45)]"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="mb-3">
              <div className="text-sm font-semibold text-white mb-2">Your Referral Link</div>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/5 rounded-lg px-3 py-2 border border-white/10 min-w-0">
                  <div className="text-xs text-gray-300 mb-1">Link</div>
                  <div className="text-xs font-mono text-white truncate">
                    {typeof window !== 'undefined' ? `${window.location.origin}?ref=${referralCode}` : ''}
                  </div>
                </div>
                <Button
                  onClick={copyReferralCode}
                  size="sm"
                  className="flex-shrink-0 bg-gradient-to-r from-[#7c5dff] via-[#5eead4] to-[#22d3ee] text-white border-0 shadow-[0_8px_20px_rgba(124,93,255,0.35)] hover:shadow-[0_10px_24px_rgba(124,93,255,0.45)]"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="text-xs text-white/80 bg-white/5 rounded-lg p-2 border border-white/10">
              💡 Share your referral link with friends. When they sign up using your link, you'll automatically receive 1 ZENTRA token!
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.28)] border border-white/10 backdrop-blur-lg">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-[#5eead4]" />
              <div className="text-sm font-semibold text-white">Referral History</div>
            </div>
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
            ) : referrals.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                No referrals yet. Start sharing your code!
              </div>
            ) : (
              <div className="space-y-2">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-2">
                      {referral.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-500 flex-shrink-0" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-white">
                          Referral #{referral.id.slice(0, 8)}
                        </div>
                        <div className="text-xs text-gray-300">
                          {new Date(referral.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">
                        {referral.reward_amount || 0} ZENTRA
                      </div>
                      <div
                        className={`text-xs ${
                          referral.status === 'completed' ? 'text-emerald-400' : 'text-amber-300'
                        }`}
                      >
                        {referral.status === 'completed' ? 'Completed' : 'Pending'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

