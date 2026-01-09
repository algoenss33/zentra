"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Database } from "@/lib/supabase/types"

type Withdrawal = Database['public']['Tables']['withdrawals']['Row']

const withdrawSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  token: z.string().min(1, "Token is required"),
  walletAddress: z.string().min(10, "Valid wallet address is required"),
})

type WithdrawFormData = z.infer<typeof withdrawSchema>

export function WithdrawSection() {
  const { profile } = useAuth()
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(false) // Start with false - don't block UI
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<WithdrawFormData>({
    resolver: zodResolver(withdrawSchema),
    defaultValues: {
      token: "USDT",
    },
  })

  const loadWithdrawals = useCallback(async (showLoading: boolean = false) => {
    if (!profile) return

    if (showLoading) {
      setLoading(true)
    }

    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setWithdrawals(data || [])
      }
    } catch (error: any) {
      console.error('Error loading withdrawals:', error)
      // Don't show error toast - keep existing data
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [profile])

  useEffect(() => {
    if (!profile) {
      setWithdrawals([])
      return
    }

    // Load withdrawals on mount
    loadWithdrawals(true)

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`withdrawals-changes-${profile.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'withdrawals',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          // Update in background without showing loading
          loadWithdrawals(false)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel).catch(() => {
        // Silently handle channel removal errors during cleanup
      })
    }
  }, [profile, loadWithdrawals])

  const onSubmit = async (data: WithdrawFormData) => {
    if (!profile) return

    setIsSubmitting(true)
    try {
      const { error } = await (supabase
        .from('withdrawals') as any)
        .insert({
          user_id: profile.id,
          amount: data.amount,
          token: data.token,
          wallet_address: data.walletAddress,
          status: 'pending',
        })

      if (error) throw error
      toast.success('Withdrawal request submitted successfully!')
      reset()
      loadWithdrawals()
    } catch (error: any) {
      console.error('Error creating withdrawal:', error)
      toast.error(error.message || 'Failed to submit withdrawal request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500'
      case 'processing':
        return 'text-blue-500'
      case 'failed':
        return 'text-red-500'
      default:
        return 'text-yellow-500'
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-lg"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5" />
          Withdraw Funds
        </h3>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Token</Label>
            <select
              id="token"
              {...register("token")}
              className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              disabled={isSubmitting}
            >
              <option value="USDT">USDT</option>
              <option value="USDC">USDC</option>
              <option value="BTC">BTC</option>
              <option value="ETH">ETH</option>
            </select>
            {errors.token && (
              <p className="text-sm text-destructive">{errors.token.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              {...register("amount", { valueAsNumber: true })}
              placeholder="0.00"
              disabled={isSubmitting}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="walletAddress">Wallet Address</Label>
            <Input
              id="walletAddress"
              {...register("walletAddress")}
              placeholder="Enter your wallet address"
              disabled={isSubmitting}
            />
            {errors.walletAddress && (
              <p className="text-sm text-destructive">{errors.walletAddress.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Submit Withdrawal"}
          </Button>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass p-6 rounded-lg"
      >
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <History className="w-4 h-4" />
          Withdrawal History
        </h4>
        {loading ? (
          <div className="text-center py-8 text-text-muted">Loading...</div>
        ) : withdrawals.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            No withdrawals yet.
          </div>
        ) : (
          <div className="space-y-2">
            {withdrawals.map((withdrawal) => (
              <div
                key={withdrawal.id}
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg"
              >
                <div>
                  <div className="font-medium">
                    {withdrawal.amount} {withdrawal.token}
                  </div>
                  <div className="text-sm text-text-muted">
                    {withdrawal.wallet_address.slice(0, 10)}...{withdrawal.wallet_address.slice(-8)}
                  </div>
                  <div className="text-xs text-text-muted">
                    {new Date(withdrawal.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-medium ${getStatusColor(withdrawal.status)}`}>
                    {withdrawal.status}
                  </div>
                  {withdrawal.tx_hash && (
                    <div className="text-xs text-text-muted font-mono">
                      {withdrawal.tx_hash.slice(0, 10)}...
                    </div>
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

