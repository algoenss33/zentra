"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Circle, Trophy, ExternalLink, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Database } from "@/lib/supabase/types"

type Task = Database['public']['Tables']['tasks']['Row']

const AVAILABLE_TASKS = [
  { type: 'join_telegram_group', name: 'Join Telegram Group', reward: 5, link: 'https://t.me/zentragroup' },
  { type: 'invite_3', name: 'Invite 3 People', reward: 10 },
  { type: 'invite_5', name: 'Invite 5 People', reward: 20 },
  { type: 'invite_10', name: 'Invite 10 People', reward: 50 },
]

export function AirdropMobileSection() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false) // Start with false - don't block UI
  const [referralCount, setReferralCount] = useState(0)
  const [openedLinks, setOpenedLinks] = useState<Set<string>>(new Set())
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const loadTasks = useCallback(async (showLoading: boolean = false) => {
    if (!profile) return

    if (showLoading) {
      setLoading(true)
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) {
        setTasks(data || [])
      }
    } catch (error: any) {
      console.error('Error loading tasks:', error)
      // Don't show error toast - keep existing data
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }, [profile])

  useEffect(() => {
    if (!profile) {
      setTasks([])
      return
    }

    // Load tasks and referral count on mount
    loadTasks(true)
    loadReferralCount()

    // Subscribe to real-time updates for tasks
    const channel = supabase
      .channel(`tasks-changes-${profile.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${profile.id}`,
        },
        () => {
          // Update tasks in real-time without showing loading
          loadTasks(false)
          // Also trigger balance update when task changes
          window.dispatchEvent(new Event('balance-updated'))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel).catch(() => {
        // Silently handle channel removal errors during cleanup
      })
      // Cleanup all pending timeouts
      timeoutRefs.current.forEach((timeout) => {
        clearTimeout(timeout)
      })
      timeoutRefs.current.clear()
    }
  }, [profile, loadTasks])

  const loadReferralCount = async () => {
    if (!profile) return

    try {
      const { data, error } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: false })
        .eq('referrer_id', profile.id)
        .eq('status', 'completed')

      if (error) throw error
      setReferralCount(data?.length || 0)
    } catch (error: any) {
      console.error('Error loading referral count:', error)
    }
  }


  const completeTask = async (taskType: string) => {
    if (!profile) return
    if (completingTask) return // Prevent multiple simultaneous completions

    try {
      setCompletingTask(taskType)

      // Check if task already exists and is completed
      const existingTask = tasks.find(t => t.task_type === taskType)
      
      if (existingTask && existingTask.status === 'completed') {
        // Cancel any pending timeout for this task
        const existingTimeout = timeoutRefs.current.get(taskType)
        if (existingTimeout) {
          clearTimeout(existingTimeout)
          timeoutRefs.current.delete(taskType)
        }
        setCompletingTask(null)
        return // Silently return - don't show error if already completed
      }

      const taskInfo = AVAILABLE_TASKS.find(t => t.type === taskType)
      if (!taskInfo) {
        setCompletingTask(null)
        return
      }

      // For invite tasks, check if user has enough referrals
      if (taskType === 'invite_3' && referralCount < 3) {
        toast.error('You need to invite at least 3 people')
        setCompletingTask(null)
        return
      }
      if (taskType === 'invite_5' && referralCount < 5) {
        toast.error('You need to invite at least 5 people')
        setCompletingTask(null)
        return
      }
      if (taskType === 'invite_10' && referralCount < 10) {
        toast.error('You need to invite at least 10 people')
        setCompletingTask(null)
        return
      }

      const rewardAmount = taskInfo.reward
      const zentraPrice = 0.5
      const usdValue = rewardAmount * zentraPrice

      // Optimistic update - update UI immediately with completed status
      const optimisticTask: Task = existingTask 
        ? {
            ...existingTask,
            status: 'completed' as const,
            completed_at: new Date().toISOString(),
            reward_amount: rewardAmount,
          }
        : {
            id: `temp-${Date.now()}`,
            user_id: profile.id,
            task_type: taskType,
            task_data: {},
            reward_amount: rewardAmount,
            status: 'completed' as const,
            completed_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
          }
      
      // Update state immediately for optimistic UI update
      setTasks(prev => {
        if (existingTask) {
          return prev.map(t => t.id === existingTask.id ? optimisticTask : t)
        } else {
          return [optimisticTask, ...prev]
        }
      })

      // Perform database operations in parallel for faster completion
      const [taskResult, balanceResult] = await Promise.all([
        existingTask
          ? supabase
              .from('tasks')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', existingTask.id)
          : supabase
              .from('tasks')
              .insert({
                user_id: profile.id,
                task_type: taskType,
                task_data: {},
                reward_amount: rewardAmount,
                status: 'completed',
                completed_at: new Date().toISOString(),
              }),
        supabase
          .from('balances')
          .select('*')
          .eq('user_id', profile.id)
          .eq('token', 'ZENTRA')
          .single()
      ])

      if (taskResult.error) throw taskResult.error

      const { data: existingBalance, error: balanceError } = balanceResult

      if (balanceError && balanceError.code !== 'PGRST116') {
        throw balanceError
      }

      // Update balance
      if (existingBalance) {
        const { error: updateError } = await supabase
          .from('balances')
          .update({ 
            balance: existingBalance.balance + rewardAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingBalance.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase
          .from('balances')
          .insert({
            user_id: profile.id,
            token: 'ZENTRA',
            balance: rewardAmount,
          })

        if (insertError) throw insertError
      }

      // Create transaction record (non-blocking but important for activity)
      supabase
        .from('transactions')
        .insert({
          user_id: profile.id,
          type: 'task_reward',
          token: 'ZENTRA',
          amount: rewardAmount,
          usd_value: usdValue,
          status: 'confirmed',
        })
        .then(() => {
          // Trigger transaction update event for real-time activity
          window.dispatchEvent(new Event('transaction-updated'))
          // Also trigger balance update
          window.dispatchEvent(new Event('balance-updated'))
        })
        .catch(() => {
          // Silently handle transaction errors - balance already updated
        })

      // Cancel any pending timeout for this task
      const existingTimeout = timeoutRefs.current.get(taskType)
      if (existingTimeout) {
        clearTimeout(existingTimeout)
        timeoutRefs.current.delete(taskType)
      }
      
      toast.success(`Task completed! You earned ${rewardAmount} ZENTRA tokens.`)
      
      // Reload tasks to get actual data from database (realtime subscription will also update)
      await loadTasks(false)
      
      // Trigger balance update once - real-time subscription will handle the rest
      window.dispatchEvent(new Event('balance-updated'))
    } catch (error: any) {
      console.error('Error completing task:', error)
      toast.error('Failed to complete task. Please try again.')
      
      // Revert optimistic update on error
      loadTasks()
    } finally {
      setCompletingTask(null)
    }
  }

  const getTaskStatus = (taskType: string) => {
    const task = tasks.find(t => t.task_type === taskType)
    if (!task) return 'pending'
    return task.status
  }

  const getTaskProgress = (taskType: string) => {
    if (taskType === 'invite_3') return { current: referralCount, required: 3 }
    if (taskType === 'invite_5') return { current: referralCount, required: 5 }
    if (taskType === 'invite_10') return { current: referralCount, required: 10 }
    return null
  }


  // Handle link opening - automatically complete task for telegram tasks
  const handleOpenLink = async (taskType: string, link: string) => {
    if (!profile) return
    
    // Cancel any existing timeout for this task first
    const existingTimeout = timeoutRefs.current.get(taskType)
    if (existingTimeout) {
      clearTimeout(existingTimeout)
      timeoutRefs.current.delete(taskType)
    }
    
    // Check if task is already completed (use current state - realtime will update)
    const existingTask = tasks.find(t => t.task_type === taskType)
    if (existingTask && existingTask.status === 'completed') {
      // Task already completed, just open the link
      return
    }
    
    // Mark link as opened
    setOpenedLinks(prev => new Set(prev).add(taskType))
    
    // For telegram tasks, automatically complete after opening link
    if (taskType === 'join_telegram_group') {
      // Small delay to ensure link opens, then auto-complete
      const timeoutId = setTimeout(() => {
        completeTask(taskType).finally(() => {
          timeoutRefs.current.delete(taskType)
        })
      }, 800)
      
      timeoutRefs.current.set(taskType, timeoutId)
    }
  }

  const totalRewards = useMemo(() => {
    return tasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.reward_amount || 0), 0)
  }, [tasks])

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d] text-white overflow-hidden">
      {/* Ambient glows - optimized with will-change for better performance */}
      <div className="absolute -top-20 -left-16 w-60 h-60 bg-[#7c5dff]/20 blur-[70px] pointer-events-none will-change-transform" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#f472b6]/15 blur-[80px] pointer-events-none will-change-transform" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#22d3ee]/10 blur-[90px] pointer-events-none will-change-transform" />

      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="px-4 pt-8 pb-4 bg-black/20 backdrop-blur-md flex-shrink-0 border-b border-white/10">
          <div>
            <h2 className="text-xl font-bold mb-1">Airdrop</h2>
            <p className="text-sm text-gray-300">Complete tasks to earn ZENTRA tokens</p>
          </div>
        </div>

        {/* Content - Scrollable without scrollbar */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 space-y-4 pb-6" style={{ 
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}>
          <div className="bg-gradient-to-r from-[#a855f7] via-[#f472b6] to-[#fb7185] rounded-xl p-4 shadow-[0_12px_35px_rgba(168,85,247,0.35)] border border-white/15">
            <div className="text-white">
              <div className="text-xs opacity-90 mb-1">Total Earned</div>
              <div className="text-2xl font-bold">{totalRewards} ZENTRA</div>
            </div>
          </div>

          <div className="space-y-3">
            {AVAILABLE_TASKS.map((task) => {
              const status = getTaskStatus(task.type)
              const isCompleted = status === 'completed'
              const progress = getTaskProgress(task.type)
              const canComplete = !progress || progress.current >= progress.required
              const hasOpenedLink = openedLinks.has(task.type)
              
              // Show complete button if:
              // 1. Task is already completed - always show completed status
              // 2. For telegram tasks with link: link has been opened
              // 3. For invite tasks: progress requirement met
              const canShowComplete = isCompleted 
                ? true // Always show completed status
                : task.link 
                  ? hasOpenedLink
                  : true

              return (
                <motion.div
                  key={task.type}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-xl p-4 shadow-[0_10px_30px_rgba(0,0,0,0.28)] border border-white/10 backdrop-blur-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm mb-1">{task.name}</div>
                        <div className="text-xs text-gray-300 mb-2">
                          Reward: {task.reward} ZENTRA
                        </div>
                        {progress && (
                          <div className="text-xs text-gray-400 mb-2">
                            Progress: {progress.current}/{progress.required} invites
                          </div>
                        )}
                        {task.link && !hasOpenedLink && !isCompleted && (
                          <div className="text-xs text-blue-400 mb-2">
                            Click "Open Link" to enable Complete button
                          </div>
                        )}
                        {task.link && (
                          <a
                            href={task.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.preventDefault()
                              handleOpenLink(task.type, task.link)
                              // Open link in new tab
                              window.open(task.link, '_blank', 'noopener,noreferrer')
                            }}
                            className="text-xs text-[#5eead4] flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                          >
                            Open Link <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="ml-1">
                      {isCompleted ? (
                        <span className="text-xs font-semibold text-emerald-400">Completed</span>
                      ) : canShowComplete ? (
                        <Button
                          size="sm"
                          onClick={() => completeTask(task.type)}
                          disabled={loading || !canComplete || completingTask !== null}
                          className="text-xs h-8 px-3 bg-gradient-to-r from-[#7c5dff] via-[#5eead4] to-[#22d3ee] text-white border-0 shadow-[0_8px_20px_rgba(124,93,255,0.35)] hover:shadow-[0_10px_24px_rgba(124,93,255,0.45)] disabled:opacity-60"
                        >
                          {completingTask === task.type ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Complete'
                          )}
                        </Button>
                      ) : (
                        <span className="text-xs text-gray-500">Locked</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

