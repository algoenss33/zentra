"use client"

import { motion } from "framer-motion"
import { useBalance } from "@/hooks/use-balance"
import { useCryptoPrices } from "@/hooks/use-crypto-prices"
import Image from "next/image"
import { useMemo } from "react"

const ZENTRA_PRICE = 0.5

const tokenImages: Record<string, string> = {
  ZENTRA: '/chain/zentra.png',
  BTC: '/chain/bitcoin.png',
  ETH: '/chain/ethereum.png',
  USDT: '/chain/Tether.png',
  USDC: '/chain/usdc.png',
  SOL: '/chain/solana.png',
  BNB: '/chain/bnb-icon2_2x.png',
  TRX: '/chain/tron-logo.png',
  XRP: '/chain/xrp-symbol-white-128.png',
  DOGE: '/chain/dogecoin.png',
  STETH: '/chain/steth_logo.png',
}

const tokenNames: Record<string, string> = {
  ZENTRA: 'Zentra',
  BTC: 'Bitcoin',
  ETH: 'Ethereum',
  USDT: 'Tether',
  USDC: 'USD Coin',
  SOL: 'Solana',
  BNB: 'BNB',
  TRX: 'Tron',
  XRP: 'Ripple',
  DOGE: 'Dogecoin',
  STETH: 'Staked ETH',
}

// Fallback prices for all tokens
const FALLBACK_PRICES: Record<string, number> = {
  ZENTRA: 0.5,
  BTC: 95000,
  ETH: 3500,
  USDT: 1.0,
  USDC: 1.0,
  SOL: 150,
  BNB: 300,
  TRX: 0.29,
  XRP: 0.6,
  DOGE: 0.08,
  STETH: 3500,
}

export function AssetList() {
  const { balances, getBalance, zentraPrice } = useBalance()
  const { getPrice } = useCryptoPrices()

  // Helper function to get token price with fallback
  const getTokenPrice = (symbol: string): number => {
    if (symbol === 'ZENTRA') return zentraPrice || FALLBACK_PRICES.ZENTRA
    const apiPrice = getPrice(symbol)
    if (apiPrice !== null && apiPrice > 0 && !isNaN(apiPrice)) {
      return apiPrice
    }
    return FALLBACK_PRICES[symbol] || 0
  }

  // Get all tokens from balances and create assets list
  const assets = useMemo(() => {
    // Get all unique tokens from balances
    const allTokens = balances.map(b => b.token)
    const uniqueTokens = Array.from(new Set(allTokens))
    
    // Create assets from balances
    const assetsList = uniqueTokens.map(token => {
      const balance = getBalance(token)
      const price = getTokenPrice(token)
      const value = balance * price
      
      return {
        symbol: token,
        name: tokenNames[token] || token,
        balance,
        value,
        price,
        image: tokenImages[token] || '/chain/zentra.png',
      }
    })
    
    // Sort by balance (highest first), then by value (highest first)
    // ZENTRA always first if it has balance
    // After ZENTRA, token with highest balance comes next
    return assetsList.sort((a, b) => {
      // ZENTRA always first if it has balance
      if (a.symbol === 'ZENTRA' && a.balance > 0) return -1
      if (b.symbol === 'ZENTRA' && b.balance > 0) return 1
      
      // After ZENTRA, sort by balance (highest first) - saldo yang lebih banyak di bawah ZENTRA
      if (b.balance !== a.balance) {
        return b.balance - a.balance
      }
      
      // If balance is same, sort by value (highest first)
      return b.value - a.value
    })
  }, [balances, getBalance, zentraPrice, getPrice])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass p-4 sm:p-6 rounded-xl"
    >
      <h3 className="text-lg sm:text-xl font-bold mb-4">Assets</h3>
      <div className="space-y-2 sm:space-y-3">
        {assets.map((asset) => (
          <motion.div
            key={asset.symbol}
            whileHover={{ translateX: 4 }}
            className="flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: asset.symbol === 'ZENTRA' 
                ? "rgba(0, 240, 255, 0.1)" 
                : "rgba(36, 45, 74, 0.5)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = asset.symbol === 'ZENTRA'
                ? "rgba(0, 240, 255, 0.15)"
                : "rgba(36, 45, 74, 0.7)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = asset.symbol === 'ZENTRA'
                ? "rgba(0, 240, 255, 0.1)"
                : "rgba(36, 45, 74, 0.5)"
            }}
          >
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="relative w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                <Image
                  src={asset.image}
                  alt={asset.name}
                  fill
                  className="rounded-full object-cover"
                  sizes="(max-width: 640px) 40px, 48px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-mono font-bold text-sm sm:text-base truncate">{asset.symbol}</p>
                <p className="text-xs text-text-muted truncate">
                  {asset.balance.toFixed(asset.symbol === 'ZENTRA' ? 0 : 4)} {asset.symbol}
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
              <p className="text-sm sm:text-base font-bold">${asset.value.toFixed(2)}</p>
              {asset.price > 0 && (
                <p className="text-xs text-text-muted">${asset.price.toFixed(4)}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
