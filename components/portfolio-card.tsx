"use client"

import { motion } from "framer-motion"
import { useBalance } from "@/hooks/use-balance"

export function PortfolioCard() {
  const { getTotalPortfolioValue, getZentraBalance, zentraPrice } = useBalance()
  const totalValue = getTotalPortfolioValue()
  const zentraBalance = getZentraBalance()

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass p-4 sm:p-6 md:p-8 rounded-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="flex-1">
          <p className="text-text-muted text-xs sm:text-sm mb-2">Total Portfolio Balance</p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-primary mb-2">${totalValue.toFixed(2)}</h2>
          <div className="flex items-center gap-2">
            <span className="text-text-muted font-mono text-xs sm:text-sm">Real-time balance</span>
          </div>
        </div>
        <div className="text-left sm:text-right w-full sm:w-auto">
          <p className="text-text-muted text-xs sm:text-sm mb-2 sm:mb-4">Zentra Token</p>
          <div className="text-2xl sm:text-3xl font-bold text-primary">{zentraBalance.toFixed(0)} ZENTRA</div>
          <p className="text-text-muted text-xs sm:text-sm">${zentraPrice.toFixed(2)}</p>
        </div>
      </div>
    </motion.div>
  )
}
