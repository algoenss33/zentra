"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect, useRef } from "react"
import { Send, ArrowDownLeft, Clock, CheckCircle, Gift, Trophy, Users, Loader2, ArrowLeftRight } from "lucide-react"
import { useTransactions } from "@/hooks/use-transactions"
import { formatDistanceToNow } from "date-fns"

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'send':
      return Send
    case 'receive':
      return ArrowDownLeft
    case 'swap':
      return ArrowLeftRight
    case 'airdrop':
      return Gift
    case 'task_reward':
      return Trophy
    case 'referral_reward':
      return Users
    default:
      return Send
  }
}

const getTransactionLabel = (type: string) => {
  switch (type) {
    case 'send':
      return 'Sent'
    case 'receive':
      return 'Received'
    case 'swap':
      return 'Swap'
    case 'airdrop':
      return 'Airdrop'
    case 'task_reward':
      return 'Task Reward'
    case 'referral_reward':
      return 'Referral Reward'
    default:
      return 'Transaction'
  }
}

const getTransactionColor = (type: string) => {
  switch (type) {
    case 'send':
      return 'text-red-400'
    case 'receive':
      return 'text-green-400'
    case 'swap':
      return 'text-cyan-400'
    case 'airdrop':
      return 'text-purple-400'
    case 'task_reward':
      return 'text-yellow-400'
    case 'referral_reward':
      return 'text-blue-400'
    default:
      return 'text-gray-400'
  }
}

const getTransactionBgColor = (type: string) => {
  switch (type) {
    case 'send':
      return 'bg-red-400/10'
    case 'receive':
      return 'bg-green-400/10'
    case 'swap':
      return 'bg-cyan-400/10'
    case 'airdrop':
      return 'bg-purple-400/10'
    case 'task_reward':
      return 'bg-yellow-400/10'
    case 'referral_reward':
      return 'bg-blue-400/10'
    default:
      return 'bg-gray-400/10'
  }
}

export function ActivityMobileSection() {
  const { transactions, loading } = useTransactions()
  const prevTransactionsCountRef = useRef<number>(0)
  const [newTransactions, setNewTransactions] = useState<Set<string>>(new Set())
  
  // Detect new transactions
  useEffect(() => {
    if (transactions.length > prevTransactionsCountRef.current && prevTransactionsCountRef.current > 0) {
      // New transactions detected - mark them as new
      const newTxIds = transactions
        .slice(0, transactions.length - prevTransactionsCountRef.current)
        .map(tx => tx.id)
      
      setNewTransactions(new Set(newTxIds))
      
      // Remove "new" status after 5 seconds
      setTimeout(() => {
        setNewTransactions(new Set())
      }, 5000)
    }
    prevTransactionsCountRef.current = transactions.length
  }, [transactions])

  // Don't block UI with loading - always show content
  if (transactions.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-6 relative" style={{
        paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain'
      }}>
        <div className="max-w-md mx-auto w-full">
          <div className="bg-white/6 rounded-2xl p-6 border border-white/10 backdrop-blur-sm text-center">
            <h3 className="text-lg font-bold text-white mb-4">Activity</h3>
            <div className="py-12">
              <Clock className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-300 text-sm">No recent activity</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-6 relative" style={{
      paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))',
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'contain'
    }}>
      <div className="max-w-md mx-auto w-full space-y-4">
        <div className="bg-white/6 rounded-2xl p-4 border border-white/10 backdrop-blur-sm">
          <h3 className="text-lg font-bold text-white mb-1">Activity</h3>
          <p className="text-xs text-gray-400">{transactions.length} {transactions.length === 1 ? 'transaction' : 'transactions'}</p>
        </div>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {transactions.map((tx, index) => {
              const Icon = getTransactionIcon(tx.type)
              const isOutgoing = tx.type === 'send'
              const isSwap = tx.type === 'swap'
              const timeAgo = formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })
              const iconColor = getTransactionColor(tx.type)
              const iconBg = getTransactionBgColor(tx.type)
              // Check if this is a new transaction
              const isNew = newTransactions.has(tx.id)
              // Highlight newest transactions (created in last 30 seconds)
              const isRecent = new Date().getTime() - new Date(tx.created_at).getTime() < 30000
              
              return (
                <motion.div
                  key={tx.id}
                  layout
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    borderColor: isNew || isRecent 
                      ? 'rgba(34, 197, 94, 0.3)' 
                      : 'rgba(255, 255, 255, 0.1)',
                    backgroundColor: isNew || isRecent
                      ? 'rgba(34, 197, 94, 0.05)'
                      : 'rgba(255, 255, 255, 0.06)'
                  }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ 
                    layout: { duration: 0.3 },
                    opacity: { duration: 0.2 },
                    scale: { duration: 0.2 },
                    borderColor: { duration: 0.3 },
                    backgroundColor: { duration: 0.3 }
                  }}
                  className={`rounded-xl p-4 border backdrop-blur-sm hover:bg-white/8 transition-all ${
                    isNew || isRecent 
                      ? 'shadow-[0_0_20px_rgba(34,197,94,0.15)] ring-2 ring-green-400/20' 
                      : ''
                  }`}
                >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-lg flex-shrink-0 ${iconBg}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white text-sm truncate">
                          {getTransactionLabel(tx.type)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {tx.type === 'send' && tx.to_address 
                            ? `to ${tx.to_address.slice(0, 6)}...${tx.to_address.slice(-4)}`
                            : tx.type === 'receive' && tx.from_address
                            ? `from ${tx.from_address.slice(0, 6)}...${tx.from_address.slice(-4)}`
                            : tx.type === 'swap'
                            ? 'Token swap completed'
                            : tx.type === 'task_reward'
                            ? 'Task completed'
                            : tx.type === 'referral_reward'
                            ? 'Referral bonus'
                            : tx.type === 'airdrop'
                            ? 'Airdrop received'
                            : tx.type}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {tx.status === "confirmed" ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : tx.status === "pending" ? (
                          <Clock className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <Clock className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                      <div>
                        <p className={`font-bold text-sm ${isOutgoing ? 'text-red-400' : isSwap ? 'text-cyan-400' : 'text-green-400'}`}>
                          {isOutgoing ? "-" : isSwap ? "↔" : "+"}
                          {tx.amount.toFixed(tx.token === 'ZENTRA' ? 0 : 4)} {tx.token}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">${tx.usd_value.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">{timeAgo}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

