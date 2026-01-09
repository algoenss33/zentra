"use client"

import { motion } from "framer-motion"
import { Send, ArrowDownLeft, ArrowLeftRight, Clock, CheckCircle, Gift, Trophy, Users } from "lucide-react"
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

export function TransactionsList() {
  const { transactions } = useTransactions()

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass p-6 rounded-xl"
      >
        <h3 className="text-xl font-bold mb-4">Recent Transactions</h3>
        <div className="text-center py-8 text-text-muted">
          No transactions yet
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass p-4 sm:p-6 rounded-xl"
    >
      <h3 className="text-lg sm:text-xl font-bold mb-4">Recent Transactions</h3>
      <div className="space-y-3">
        {transactions.map((tx) => {
          const Icon = getTransactionIcon(tx.type)
          const isOutgoing = tx.type === 'send'
          const isSwap = tx.type === 'swap'
          const timeAgo = formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })
          
          return (
            <motion.div
              key={tx.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg cursor-pointer transition-all"
              style={{
                backgroundColor: "rgba(36, 45, 74, 0.5)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(0, 240, 255, 0.05)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(36, 45, 74, 0.5)"
              }}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="p-2 rounded-lg flex-shrink-0"
                  style={{
                    backgroundColor: isOutgoing 
                      ? "rgba(239, 68, 68, 0.1)" 
                      : "rgba(16, 185, 129, 0.1)",
                  }}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isOutgoing ? "text-error" : "text-success"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono font-bold text-xs sm:text-sm truncate">
                    {getTransactionLabel(tx.type)} {tx.token}
                  </p>
                  <p className="text-xs text-text-muted truncate">
                    {tx.type === 'send' && tx.to_address 
                      ? `to ${tx.to_address.slice(0, 6)}...${tx.to_address.slice(-4)}`
                      : tx.type === 'receive' && tx.from_address
                      ? `from ${tx.from_address.slice(0, 6)}...${tx.from_address.slice(-4)}`
                      : tx.type === 'swap'
                      ? 'Token swap completed'
                      : tx.type}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto">
                <div className="text-left sm:text-right">
                  <p className={`font-mono font-bold text-xs sm:text-sm ${isSwap ? 'text-cyan-400' : ''}`}>
                    {isOutgoing ? "-" : isSwap ? "↔" : "+"}
                    {tx.amount.toFixed(tx.token === 'ZENTRA' ? 0 : 4)} {tx.token}
                  </p>
                  <p className="text-xs text-text-muted">${tx.usd_value.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {tx.status === "confirmed" ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
                  ) : tx.status === "pending" ? (
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
                  ) : (
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-error" />
                  )}
                  <span className="text-xs text-text-muted hidden sm:inline">{timeAgo}</span>
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
