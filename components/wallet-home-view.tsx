"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useBalance } from "@/hooks/use-balance"
import { useCryptoPrices } from "@/hooks/use-crypto-prices"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import Image from "next/image"
import {
  Send,
  ArrowUp,
  ArrowDownCircle,
  ArrowLeftRight,
  Clock,
  Search,
  ChevronDown,
  Eye,
  Copy,
  Maximize2,
  MoreVertical,
  LogOut,
  X,
} from "lucide-react"

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

interface WalletHomeViewProps {
  onSwapClick?: () => void
  onSendClick?: () => void
  onReceiveClick?: () => void
  onHistoryClick?: () => void
  onAssetClick?: (symbol: string) => void
}

export function WalletHomeView({
  onSwapClick,
  onSendClick,
  onReceiveClick,
  onHistoryClick,
  onAssetClick,
}: WalletHomeViewProps) {
  const { getBalance, zentraPrice, loading, balances } = useBalance()
  const { getPrice, getChange24h, formatPrice, formatChange24h } = useCryptoPrices()
  const { profile, signOut } = useAuth()
  const [showSendPopup, setShowSendPopup] = useState(false)
  const [activeTab, setActiveTab] = useState<'exchange' | 'web3'>('web3')
  const [showWalletDropdown, setShowWalletDropdown] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success("Signed out successfully")
    } catch (error) {
      console.error("Error signing out:", error)
      toast.error("Failed to sign out")
    }
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

  // Get token price helper with fallback
  const getTokenPrice = (symbol: string): number => {
    if (symbol === 'ZENTRA') return zentraPrice || FALLBACK_PRICES.ZENTRA
    const apiPrice = getPrice(symbol)
    if (apiPrice !== null && apiPrice > 0 && !isNaN(apiPrice)) {
      return apiPrice
    }
    return FALLBACK_PRICES[symbol] || 0
  }

  // Get token change 24h helper
  const getTokenChange24h = (symbol: string): number => {
    if (symbol === 'ZENTRA') return 2.5
    const change = getChange24h(symbol)
    return change || 0
  }

  // Get all tokens from balances and create assets list, sorted by balance (highest first)
  const assets = balances
    .map(balance => {
      const symbol = balance.token
      const balanceAmount = balance.balance
      const price = getTokenPrice(symbol)
      const change24h = getTokenChange24h(symbol)
      const value = balanceAmount * price
      
      return {
        symbol,
        name: tokenNames[symbol] || symbol,
        balance: balanceAmount,
        value,
        price,
        change24h,
        image: tokenImages[symbol] || '/chain/zentra.png',
      }
    })
    .sort((a, b) => {
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

  // Calculate total portfolio value
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0)
  
  // Count assets with balance > 0
  const assetsWithBalance = assets.filter(asset => asset.balance > 0).length

  // Mock NFTs data
  const nfts = [
    { id: 1, name: 'NFT 1', image: '/placeholder.jpg' },
    { id: 2, name: 'NFT 2', image: '/placeholder.jpg' },
    { id: 3, name: 'NFT 3', image: '/placeholder.jpg' },
    { id: 4, name: 'NFT 4', image: '/placeholder.jpg' },
  ]

  // Don't block UI with loading - always show content with fallback data
  return (
    <div className="bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d] text-white w-full h-full relative overflow-hidden flex flex-col" style={{ minHeight: '100%', height: '100%' }}>
      {/* Ambient gradient blobs matching logo colors */}
      <div className="absolute -top-24 -left-20 w-64 h-64 bg-[#22c55e]/30 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-16 -right-12 w-56 h-56 bg-[#ef4444]/25 blur-[110px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#3b82f6]/20 blur-[140px] pointer-events-none" />

      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#0B0E11]/80 backdrop-blur-lg border-b border-white/10">
        <div className="px-4 py-3">
          {/* Zentra Wallet Header Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/zentra.png"
                  alt="Zentra Logo"
                  width={40}
                  height={40}
                  className="object-contain drop-shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-[#22c55e] via-[#ef4444] to-[#3b82f6] bg-clip-text text-transparent">
                  Zentra Wallet
                </h1>
                <p className="text-xs text-gray-400">
                  {profile?.nickname || "Wallet"}
                </p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="ml-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 text-gray-200 hover:text-white text-xs transition-colors"
              aria-label="Exit wallet"
              title="Exit / Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
          {/* Tabs */}
          <div className="flex items-center gap-2 mb-3 bg-white/5 border border-white/10 rounded-full p-1">
            <button
              onClick={() => setActiveTab('exchange')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative rounded-full ${
                activeTab === 'exchange'
                  ? 'text-white bg-white/15 shadow-[0_8px_18px_rgba(0,0,0,0.35)] border border-white/15'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Exchange
            </button>
            <button
              onClick={() => setActiveTab('web3')}
              className={`px-4 py-2 text-sm font-medium transition-colors relative rounded-full ${
                activeTab === 'web3'
                  ? 'text-white bg-white/15 shadow-[0_8px_18px_rgba(0,0,0,0.35)] border border-white/15'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Web3
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-[#22c55e] focus:shadow-[0_0_0_4px_rgba(34,197,94,0.18)] transition"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto scrollbar-hidden px-4 py-4 pb-20 relative" style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))'
      }}>
        {/* Main Wallet Balance */}
        <div className="mb-6 bg-white/5 border border-white/10 rounded-2xl p-4 shadow-[0_12px_60px_rgba(0,0,0,0.25)] backdrop-blur-lg">
          {/* Wallet Header with Eye Icon and Action Icons */}
          <div className="flex items-center justify-between mb-4">
            {/* Left: Eye Icon + Main wallet dropdown */}
            <div className="relative flex items-center gap-2">
              <Eye className="w-4 h-4 text-gray-300" />
              <button
                onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                className="flex items-center gap-1 text-sm text-gray-200 hover:text-white transition-colors"
              >
                Main wallet
                <ChevronDown className="w-4 h-4" />
              </button>
              {showWalletDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowWalletDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 bg-[#0f131c] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.35)] py-2 min-w-[200px] z-20 backdrop-blur">
                    <button 
                      onClick={() => setShowWalletDropdown(false)}
                      className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/5 transition-colors"
                    >
                      Main wallet
                    </button>
                    <button 
                      onClick={() => setShowWalletDropdown(false)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5 transition-colors"
                    >
                      Trading wallet
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Right: Copy, Maximize, Menu Icons */}
            <div className="flex items-center gap-3">
              <button className="p-1.5 text-gray-300 hover:text-white transition-colors">
                <Copy className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-gray-300 hover:text-white transition-colors">
                <Maximize2 className="w-4 h-4" />
              </button>
              <button className="p-1.5 text-gray-300 hover:text-white transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Balance Display */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs text-gray-200 mb-2 border border-white/10">
              Live balance
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h2 className="text-4xl font-extrabold mb-1 tracking-tight">${totalValue.toFixed(2)}</h2>
            <p className="text-sm text-gray-300">Across {assetsWithBalance} {assetsWithBalance === 1 ? 'asset' : 'assets'}</p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSendPopup(true)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/6 text-white border border-white/10 hover:border-white/25 shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all opacity-75 cursor-not-allowed"
              title="This feature will be available soon"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-2 border border-white/20">
                <ArrowUp className="w-5 h-5 text-white/90" />
              </div>
              <span className="text-xs text-white">Send</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onReceiveClick}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/6 text-white border border-white/10 hover:border-white/25 shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-2 border border-white/20">
                <ArrowDownCircle className="w-5 h-5 text-white/90" />
              </div>
              <span className="text-xs text-white">Receive</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onSwapClick}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/6 text-white border border-white/10 hover:border-white/25 shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-2 border border-white/20">
                <ArrowLeftRight className="w-5 h-5 text-white/90" />
              </div>
              <span className="text-xs text-white">Swap</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onHistoryClick}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-white/6 text-white border border-white/10 hover:border-white/25 shadow-[0_8px_30px_rgba(0,0,0,0.35)] transition-all"
            >
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-2 border border-white/20">
                <Clock className="w-5 h-5 text-white/90" />
              </div>
              <span className="text-xs text-white">History</span>
            </motion.button>
          </div>
        </div>

        {/* Exchange Tab Content */}
        {activeTab === 'exchange' && (
          <div className="mb-6 bg-gradient-to-br from-white/10 via-white/5 to-white/5 rounded-2xl p-8 border border-white/10 shadow-[0_12px_60px_rgba(0,0,0,0.25)] backdrop-blur-lg text-center">
            <div className="flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mb-4 border border-white/20">
                <ArrowLeftRight className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Exchange Not Available</h3>
              <p className="text-sm text-gray-400 max-w-xs">
                The exchange feature is currently under development and will be available soon.
              </p>
            </div>
          </div>
        )}

        {/* Web3 Tab Content */}
        {activeTab === 'web3' && (
          <>
        {/* Crypto Holdings */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">Crypto ({assetsWithBalance})</h3>
          </div>

          <div className="space-y-2">
            {assets.map((asset) => (
              <motion.div
                key={asset.symbol}
                whileTap={{ scale: 0.98 }}
                onClick={() => onAssetClick?.(asset.symbol)}
                className="flex items-center justify-between p-3 bg-gradient-to-br from-white/10 via-white/5 to-white/5 rounded-xl hover:from-white/15 hover:via-white/8 hover:to-white/8 transition-colors cursor-pointer border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.28)]"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <Image
                      src={asset.image}
                      alt={asset.name}
                      fill
                      className="rounded-full object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-semibold">{asset.symbol}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {asset.balance.toFixed(asset.symbol === 'ZENTRA' ? 0 : 4)} {asset.symbol}
                      </span>
                      <span className={`text-xs ${
                        asset.change24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {asset.symbol === 'ZENTRA' 
                          ? `$${asset.price.toFixed(4)} ${asset.change24h >= 0 ? '+' : ''}${asset.change24h.toFixed(2)}%`
                          : `${formatPrice(asset.symbol)} ${asset.change24h >= 0 ? '+' : ''}${asset.change24h.toFixed(2)}%`
                        }
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-sm font-semibold">${asset.value.toFixed(2)}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* NFTs Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold">NFTs ({nfts.length})</h3>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {nfts.map((nft) => (
              <motion.div
                key={nft.id}
                whileTap={{ scale: 0.95 }}
                className="aspect-square bg-white/6 border border-white/10 rounded-xl overflow-hidden cursor-pointer hover:border-white/25 hover:bg-white/10 transition-colors shadow-[0_8px_26px_rgba(0,0,0,0.3)]"
              >
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-12 h-12 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center">
                    <span className="text-xs text-gray-100 font-semibold tracking-wide">NFT</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
          </>
        )}
      </div>

      {/* Send Feature Popup */}
      <AnimatePresence>
        {showSendPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowSendPopup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white/6 rounded-2xl p-6 w-full max-w-sm border border-white/10 backdrop-blur-lg shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Send Feature</h3>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSendPopup(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>
              <div className="text-center py-4">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                  <Clock className="w-8 h-8 text-white/90" />
                </div>
                <p className="text-white text-base font-medium mb-2">Coming Soon</p>
                <p className="text-gray-300 text-sm">
                  This feature will be available soon
                </p>
              </div>
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSendPopup(false)}
                className="w-full mt-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition-colors border border-white/10"
              >
                Got it
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

