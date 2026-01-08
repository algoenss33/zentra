"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { CheckCircle, Circle, Trophy, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import type { Database } from "@/lib/supabase/types"

type Task = Database['public']['Tables']['tasks']['Row']

const AVAILABLE_TASKS = [
  { type: 'join_telegram_group', name: 'Join Telegram Group', reward: 5, link: 'https://t.me/zentragroup' },
  { type: 'join_telegram_channel', name: 'Join Telegram Channel', reward: 5, link: 'https://t.me/zentrachannel' },
  { type: 'invite_3', name: 'Invite 3 People', reward: 10 },
  { type: 'invite_5', name: 'Invite 5 People', reward: 20 },
  { type: 'invite_10', name: 'Invite 10 People', reward: 50 },
]

export function TasksSection() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [referralCount, setReferralCount] = useState(0)
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const [openedLinks, setOpenedLinks] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (profile) {
      // Load tasks and referral count on mount/refresh
      const initializeData = async () => {
        await Promise.all([
          loadTasks(true), // Show loading on initial load
          loadReferralCount()
        ])
        
        // After initial load, trigger balance update to ensure sync
        // Small delay to ensure tasks are loaded first
        setTimeout(() => {
          window.dispatchEvent(new Event('balance-updated'))
        }, 500)
      }
      
      initializeData()

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

      // Listen for balance updates to reload tasks if needed
      const handleBalanceUpdate = () => {
        // Reload tasks in background to ensure sync
        loadTasks(false)
      }
      
      window.addEventListener('balance-updated', handleBalanceUpdate)

      return () => {
        supabase.removeChannel(channel).catch(() => {
          // Silently handle channel removal errors during cleanup
        })
        window.removeEventListener('balance-updated', handleBalanceUpdate)
      }
    }
  }, [profile])

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

  const loadTasks = async (showLoading: boolean = false) => {
    if (!profile) return

    if (showLoading && loading) {
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
      // Don't show error toast on background reloads
      if (showLoading) {
        toast.error('Failed to load tasks')
      }
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const completeTask = async (taskType: string) => {
    if (!profile) return
    if (completingTask) return // Prevent multiple simultaneous completions

    try {
      setCompletingTask(taskType)

      // Check if task already exists
      const existingTask = tasks.find(t => t.task_type === taskType)
      
      if (existingTask && existingTask.status === 'completed') {
        toast.error('Task already completed')
        setCompletingTask(null)
        return
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

      // Optimistic update - update UI immediately
      const optimisticTask: Task = existingTask || {
        id: `temp-${Date.now()}`,
        user_id: profile.id,
        task_type: taskType,
        task_data: {},
        reward_amount: rewardAmount,
        status: 'completed',
        completed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }
      
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

      toast.success(`Task completed! You earned ${rewardAmount} ZENTRA tokens.`)
      
      // Reload tasks to get actual data from database (realtime will also update)
      // Don't show loading on background reload
      await loadTasks(false)
      
      // Trigger balance update event after tasks are reloaded
      // Multiple triggers to ensure balance sync
      window.dispatchEvent(new Event('balance-updated'))
      setTimeout(() => {
        window.dispatchEvent(new Event('balance-updated'))
      }, 300)
      setTimeout(() => {
        window.dispatchEvent(new Event('balance-updated'))
      }, 1000)
    } catch (error: any) {
      console.error('Error completing task:', error)
      toast.error('Failed to complete task. Please try again.')
      
      // Revert optimistic update on error
      loadTasks()
    } finally {
      setCompletingTask(null)
    }
  }

  // Handle link opening - automatically complete task for telegram tasks
  const handleOpenLink = async (taskType: string, link: string) => {
    if (!profile) return
    
    // Mark link as opened
    setOpenedLinks(prev => new Set(prev).add(taskType))
    
    // For telegram tasks, automatically complete after opening link
    if (taskType === 'join_telegram_group' || taskType === 'join_telegram_channel') {
      // Check if task is already completed
      const existingTask = tasks.find(t => t.task_type === taskType)
      if (existingTask && existingTask.status === 'completed') {
        return
      }
      
      // Check prerequisites
      if (taskType === 'join_telegram_channel') {
        const telegramGroupTask = tasks.find(t => t.task_type === 'join_telegram_group')
        if (!telegramGroupTask || telegramGroupTask.status !== 'completed') {
          // Still open link, but don't auto-complete
          return
        }
      }
      
      // Small delay to ensure link opens, then auto-complete
      setTimeout(() => {
        completeTask(taskType)
      }, 500)
    }
  }

  // Check if telegram group task is completed (required for telegram channel)
  const isTelegramGroupCompleted = () => {
    const telegramGroupTask = tasks.find(t => t.task_type === 'join_telegram_group')
    return telegramGroupTask?.status === 'completed'
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

  const totalRewards = tasks
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.reward_amount || 0), 0)

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-lg"
      >
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Airdrop Tasks
        </h3>

        <div className="mb-6 p-4 bg-background/50 rounded-lg">
          <div className="text-sm text-text-muted mb-1">Total Earned</div>
          <div className="text-3xl font-bold text-primary">{totalRewards} ZENTRA</div>
        </div>

        <div className="space-y-3">
          {AVAILABLE_TASKS.map((task) => {
            const status = getTaskStatus(task.type)
            const isCompleted = status === 'completed'
            const progress = getTaskProgress(task.type)
            const canComplete = !progress || progress.current >= progress.required
            
            // Check if telegram channel requires telegram group to be completed first
            const requiresTelegramGroup = task.type === 'join_telegram_channel'
            const telegramGroupCompleted = isTelegramGroupCompleted()
            const hasOpenedLink = openedLinks.has(task.type)
            
            // Show complete button if:
            // 1. For telegram tasks: link has been opened AND (no prerequisite OR prerequisite completed)
            //    OR task is already completed (will show completed status)
            // 2. For invite tasks: progress requirement met
            const canShowComplete = task.link 
              ? (hasOpenedLink && (!requiresTelegramGroup || telegramGroupCompleted)) || isCompleted
              : (!requiresTelegramGroup || telegramGroupCompleted) || isCompleted

            return (
              <div
                key={task.type}
                className="flex items-center justify-between p-4 bg-background/50 rounded-lg"
              >
                <div className="flex items-center gap-3 flex-1">
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Circle className="w-5 h-5 text-text-muted" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium">{task.name}</div>
                    <div className="text-sm text-text-muted">
                      Reward: {task.reward} ZENTRA
                    </div>
                    {progress && (
                      <div className="text-xs text-text-muted mt-1">
                        Progress: {progress.current}/{progress.required} invites
                      </div>
                    )}
                    {requiresTelegramGroup && !telegramGroupCompleted && !isCompleted && (
                      <div className="text-xs text-amber-400 mt-1 flex items-center gap-1">
                        <span>⚠️</span>
                        <span>Complete "Join Telegram Group" first</span>
                      </div>
                    )}
                    {task.link && !hasOpenedLink && !isCompleted && (!requiresTelegramGroup || telegramGroupCompleted) && (
                      <div className="text-xs text-blue-400 mt-1">
                        Click "Open Link" to complete task
                      </div>
                    )}
                    {task.link && (
                      <a
                        href={task.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault()
                          handleOpenLink(task.type, task.link!)
                          // Open link in new tab
                          window.open(task.link, '_blank', 'noopener,noreferrer')
                        }}
                        className="text-xs text-[#5eead4] flex items-center gap-1 hover:text-white transition-colors cursor-pointer mt-1"
                      >
                        Open Link <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isCompleted ? (
                    <span className="text-sm text-green-500 font-semibold">Completed</span>
                  ) : canShowComplete ? (
                    <Button
                      size="sm"
                      onClick={() => completeTask(task.type)}
                      disabled={loading || !canComplete || completingTask !== null}
                    >
                      {completingTask === task.type ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Complete'
                      )}
                    </Button>
                  ) : hasOpenedLink && requiresTelegramGroup && !telegramGroupCompleted ? (
                    <span className="text-xs text-amber-400">Waiting...</span>
                  ) : (
                    <span className="text-xs text-gray-500">Locked</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </motion.div>
    </div>
  )
}

