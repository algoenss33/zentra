"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useBalance } from "@/hooks/use-balance"
import { useCryptoPrices } from "@/hooks/use-crypto-prices"
import { Loader2, Send, ArrowDownCircle, ArrowLeftRight, TrendingUp, Wallet, Activity, Settings, User, Gift, Users, LogOut, X } from "lucide-react"
import Image from "next/image"
import { useState, useMemo, useEffect, useRef } from "react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { AirdropMobileSection } from "./airdrop/airdrop-mobile-section"
import { InviteMobileSection } from "./referral/invite-mobile-section"
import { SwapMobileSection } from "./swap/swap-mobile-section"
import { ReceiveMobileSection } from "./receive/receive-mobile-section"
import { WalletHomeView } from "./wallet-home-view"
import { ActivityMobileSection } from "./activity/activity-mobile-section"

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

export function MobileWallet() {
  const { getBalance, zentraPrice, loading, balances } = useBalance()
  const { profile, signOut } = useAuth()
  const { getPrice, getChange24h, formatPrice, formatChange24h } = useCryptoPrices()
  const [activeTab, setActiveTab] = useState<'wallet' | 'swap' | 'activity' | 'airdrop' | 'invite' | 'settings' | 'profile' | 'receive'>('wallet')
  const [hoveredAsset, setHoveredAsset] = useState<string | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showUserMenu])
  
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

  // Get token price helper - prioritize real-time prices with error handling
  const getTokenPrice = (symbol: string): number => {
    try {
      if (symbol === 'ZENTRA') return zentraPrice || FALLBACK_PRICES.ZENTRA
      
      // First try to get real-time price from API
      const realTimePrice = getPrice(symbol)
      if (realTimePrice !== null && realTimePrice > 0 && !isNaN(realTimePrice)) {
        return realTimePrice
      }
      
      // Use fallback price
      return FALLBACK_PRICES[symbol] || 0
    } catch (error) {
      console.warn('Error getting token price for', symbol, error)
      // Return safe fallback
      return FALLBACK_PRICES[symbol] || 0
    }
  }

  // Get token change 24h helper with error handling
  const getTokenChange24h = (symbol: string): number => {
    try {
      if (symbol === 'ZENTRA') return 2.5 // ZENTRA default change
      const change = getChange24h(symbol)
      if (change !== null && !isNaN(change)) return change
      
      // Fallback changes
      const fallbackChanges: Record<string, number> = {
        BTC: 2.5,
        ETH: 1.8,
        USDT: 0.01,
        SOL: 3.2,
      }
      return fallbackChanges[symbol] || 0
    } catch (error) {
      console.warn('Error getting token change for', symbol, error)
      // Return safe fallback
      const fallbackChanges: Record<string, number> = {
        BTC: 2.5,
        ETH: 1.8,
        USDT: 0.01,
        SOL: 3.2,
      }
      return fallbackChanges[symbol] || 0
    }
  }
  
  // Get all tokens from balances and create assets list, sorted by balance (highest first)
  const assets = balances
    .map(balance => {
      const symbol = balance.token
      const balanceAmount = balance.balance
      const price = getTokenPrice(symbol)
      const change24h = getTokenChange24h(symbol)
      const value = balanceAmount * price
      const change = change24h >= 0 ? `+${change24h.toFixed(2)}%` : `${change24h.toFixed(2)}%`
      
      return {
        symbol,
        name: tokenNames[symbol] || symbol,
        balance: balanceAmount,
        value,
        price,
        change24h,
        image: tokenImages[symbol] || '/chain/zentra.png',
        change,
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

  // Calculate total portfolio value with real-time prices
  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0)

  // Calculate portfolio change (weighted average of all assets)
  const portfolioChange = useMemo(() => {
    if (totalValue === 0) return { change: 0, changeAmount: 0 }
    
    let totalWeightedChange = 0
    let totalWeight = 0
    
    assets.forEach(asset => {
      if (asset.value > 0) {
        const weight = asset.value / totalValue
        totalWeightedChange += asset.change24h * weight
        totalWeight += weight
      }
    })
    
    const avgChange = totalWeight > 0 ? totalWeightedChange / totalWeight : 0
    const changeAmount = totalValue * (avgChange / 100)
    
    return {
      change: avgChange,
      changeAmount: changeAmount
    }
  }, [assets, totalValue])

  const actionButtons = [
    { icon: Send, label: 'Send', color: 'bg-blue-500', onClick: () => {} },
    { icon: ArrowDownCircle, label: 'Receive', color: 'bg-green-500', onClick: () => setActiveTab('receive') },
    { icon: ArrowLeftRight, label: 'Swap', color: 'bg-purple-500', onClick: () => setActiveTab('swap') },
    { icon: TrendingUp, label: 'Airdrop', color: 'bg-orange-500', onClick: () => setActiveTab('airdrop') },
  ]

  // Don't block UI with loading - always show content with fallback data
  return (
    <div className="bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d] w-full h-full relative flex flex-col overflow-hidden" style={{ 
      height: '100dvh', 
      minHeight: '100dvh', 
      width: '100%',
      maxWidth: '100%'
    }}>
      {/* Ambient gradient blobs */}
      <div className="absolute -top-24 -left-20 w-64 h-64 bg-[#7c5dff]/30 blur-[120px] pointer-events-none z-0" />
      <div className="absolute -bottom-16 -right-12 w-56 h-56 bg-[#ff4d8f]/25 blur-[110px] pointer-events-none z-0" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#12d6ff]/10 blur-[140px] pointer-events-none z-0" />
      {/* Main Content - Switch between different pages */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0 relative z-10" style={{ 
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        width: '100%'
      }}>
        {/* Keep all tabs mounted but hidden - prevents reloading on tab switch */}
        {/* Wallet Page */}
        <div className={activeTab !== 'wallet' ? "hidden" : "flex-1 overflow-hidden flex flex-col min-h-0"}>
          <WalletHomeView
            onSwapClick={() => setActiveTab('swap')}
            onSendClick={() => {}}
            onReceiveClick={() => setActiveTab('receive')}
            onHistoryClick={() => setActiveTab('activity')}
            onAssetClick={(symbol) => {
              // Handle asset click - could navigate to asset detail page
              console.log('Asset clicked:', symbol)
            }}
          />
        </div>

        {/* Old Wallet Page - Commented out for reference */}
        {false && activeTab === 'wallet' && (
          <>
            {/* Header */}
            <div className="px-4 pt-8 pb-3 bg-white flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Wallet</h1>
                  <p className="text-xs text-gray-500 mt-0.5 font-normal">
                    {profile?.nickname || 'User'}
                  </p>
                </div>
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shadow-sm hover:bg-gray-200 active:bg-gray-300 transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-600" />
                  </button>
                  
                  {/* User Menu Dropdown */}
                  <AnimatePresence>
                    {showUserMenu && (
                      <>
                        {/* Backdrop */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                          onClick={() => setShowUserMenu(false)}
                        />
                        {/* Menu */}
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 top-10 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                        <button
                          onClick={() => {
                            setActiveTab('profile')
                            setShowUserMenu(false)
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
                        >
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">Profile</span>
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('settings')
                            setShowUserMenu(false)
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">Settings</span>
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={async () => {
                            try {
                              await signOut()
                              toast.success("Signed out successfully")
                              setShowUserMenu(false)
                            } catch (error) {
                              console.error('Error signing out:', error)
                              toast.error("Failed to sign out")
                            }
                          }}
                          className="w-full px-4 py-2.5 text-left flex items-center gap-3 hover:bg-red-50 transition-colors text-red-600"
                        >
                          <LogOut className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-600">Logout</span>
                        </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Portfolio Balance */}
              <div className="text-center py-3">
                <p className="text-xs text-gray-500 mb-1 font-normal">Total Portfolio Value</p>
                <h2 className="text-3xl font-bold text-gray-900 mb-0.5 tracking-tight">
                  ${totalValue.toFixed(2)}
                </h2>
                <p className={`text-xs font-medium ${
                  portfolioChange.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {portfolioChange.changeAmount >= 0 ? '+' : ''}${portfolioChange.changeAmount.toFixed(2)} ({portfolioChange.change >= 0 ? '+' : ''}{portfolioChange.change.toFixed(2)}%)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-4 gap-2 mt-3">
                {actionButtons.map((action, index) => (
              <motion.button
                key={action.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={action.onClick}
                className={`${action.color} rounded-xl p-2.5 flex flex-col items-center justify-center space-y-1 shadow-sm active:shadow-md transition-all duration-200`}
              >
                <action.icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                <span className="text-[10px] font-semibold text-white">{action.label}</span>
              </motion.button>
                ))}
              </div>
            </div>

            {/* Asset List - Scrollable if needed but fits in viewport */}
            <div className="px-4 flex-1 overflow-y-auto scrollbar-hidden min-h-0" style={{ 
              paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))'
            }}>
              <h3 className="text-base font-semibold text-gray-900 mb-2 tracking-tight">Assets</h3>
              <div className="space-y-2">
                {assets.map((asset, index) => {
                  const isHovered = hoveredAsset === asset.symbol
                  const showPrice = asset.symbol !== 'ZENTRA' ? formatPrice(asset.symbol) : `$${asset.price.toFixed(4)}`
                  
                  return (
                    <motion.div
                      key={asset.symbol}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileTap={{ scale: 0.98 }}
                      onMouseEnter={() => setHoveredAsset(asset.symbol)}
                      onMouseLeave={() => setHoveredAsset(null)}
                      onTouchStart={() => setHoveredAsset(hoveredAsset === asset.symbol ? null : asset.symbol)}
                      className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 active:shadow-md transition-all duration-200 cursor-pointer relative group"
                    >
                      {/* Tooltip showing live price on hover/touch */}
                      {isHovered && asset.symbol !== 'ZENTRA' && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-xl z-20 whitespace-nowrap pointer-events-none"
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-white font-bold text-sm">{showPrice}</span>
                            <span className="text-[10px] text-gray-300 mt-0.5">Live Price</span>
                          </div>
                          {/* Arrow pointing down */}
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                            <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-gray-900"></div>
                          </div>
                        </motion.div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                          <div className="relative w-10 h-10 flex-shrink-0">
                            <Image
                              src={asset.image}
                              alt={asset.name}
                              fill
                              className="rounded-full object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 text-sm tracking-tight">{asset.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <p className="text-xs text-gray-500 truncate font-normal">
                                {asset.balance.toFixed(asset.symbol === 'ZENTRA' ? 0 : 4)} {asset.symbol}
                              </p>
                              <span className="text-[10px] text-gray-400">•</span>
                              <p className="text-xs text-gray-600 font-medium">
                                {asset.symbol === 'ZENTRA' 
                                  ? `$${asset.price.toFixed(4)}` 
                                  : asset.price > 0
                                    ? formatPrice(asset.symbol) 
                                    : 'Loading...'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="font-semibold text-gray-900 text-sm tracking-tight">
                            ${asset.value.toFixed(2)}
                          </p>
                          <div className="flex items-center justify-end gap-1.5 mt-0.5">
                            <p className={`text-xs font-semibold ${
                              asset.change?.startsWith('+') ? 'text-green-600' : asset.change?.startsWith('-') ? 'text-red-600' : 'text-gray-500'
                            }`}>
                              {asset.change}
                            </p>
                            {asset.symbol !== 'ZENTRA' && getPrice(asset.symbol) !== null && (
                              <span className="inline-flex items-center">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* Swap Page */}
        <div className={activeTab !== 'swap' ? "hidden" : "flex-1 overflow-hidden min-h-0"}>
          <SwapMobileSection onBack={() => setActiveTab('wallet')} />
        </div>

        {/* Receive Page */}
        <div className={activeTab !== 'receive' ? "hidden" : "flex-1 overflow-hidden flex flex-col min-h-0"}>
          <ReceiveMobileSection onBack={() => setActiveTab('wallet')} />
        </div>

        {/* Airdrop Page */}
        <div className={activeTab !== 'airdrop' ? "hidden" : "flex-1 overflow-hidden min-h-0"}>
          <AirdropMobileSection />
        </div>

        {/* Invite Page */}
        <div className={activeTab !== 'invite' ? "hidden" : "flex-1 overflow-hidden min-h-0"}>
          <InviteMobileSection />
        </div>

        {/* Activity Page */}
        <div className={activeTab !== 'activity' ? "hidden" : "flex-1 overflow-hidden min-h-0"}>
          <ActivityMobileSection />
        </div>

        {/* Profile Page */}
        <div 
          className={activeTab !== 'profile' ? "hidden" : "flex-1 overflow-y-auto scrollbar-hidden px-4 py-6 relative"} 
          style={activeTab === 'profile' ? { 
            paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          } : undefined}
        >
          <div className="max-w-md mx-auto w-full">
            <div className="flex items-center gap-4 mb-6">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('wallet')}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/10"
              >
                <X className="w-4 h-4 text-white" />
              </motion.button>
              <h2 className="text-xl font-bold text-white">Profile</h2>
            </div>
            
            <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/5 rounded-2xl p-6 shadow-[0_12px_35px_rgba(0,0,0,0.25)] border border-white/10 backdrop-blur-lg space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#7c5dff] via-[#5eead4] to-[#22d3ee] flex items-center justify-center border-2 border-white/20">
                  <User className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{profile?.nickname || 'User'}</h3>
                  <p className="text-sm text-gray-300">{profile?.email || 'No email'}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="border-t border-white/10 pt-4">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Account Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Nickname</p>
                      <p className="text-sm font-medium text-white">{profile?.nickname || 'Not set'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-1">Email</p>
                      <p className="text-sm font-medium text-white">{profile?.email || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Page */}
        <div 
          className={activeTab !== 'settings' ? "hidden" : "flex-1 overflow-y-auto scrollbar-hidden px-4 py-6 relative"} 
          style={activeTab === 'settings' ? { 
            paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          } : undefined}
        >
            <div className="max-w-md mx-auto w-full">
              <div className="flex items-center gap-4 mb-6">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('wallet')}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors border border-white/10"
                >
                  <X className="w-4 h-4 text-white" />
                </motion.button>
                <h2 className="text-xl font-bold text-white">Settings</h2>
              </div>
              
              <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/5 rounded-2xl p-6 shadow-[0_12px_35px_rgba(0,0,0,0.25)] border border-white/10 backdrop-blur-lg space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-300">Preferences</h3>
                  <div className="space-y-1">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 transition-colors border border-white/5"
                    >
                      <p className="text-sm font-medium text-white">Notifications</p>
                      <p className="text-xs text-gray-400">Manage notification settings</p>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 transition-colors border border-white/5"
                    >
                      <p className="text-sm font-medium text-white">Security</p>
                      <p className="text-xs text-gray-400">Password and security settings</p>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 transition-colors border border-white/5"
                    >
                      <p className="text-sm font-medium text-white">Privacy</p>
                      <p className="text-xs text-gray-400">Privacy and data settings</p>
                    </motion.button>
                  </div>
                </div>
                
                <div className="border-t border-white/10 pt-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">About</h3>
                  <div className="space-y-1">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 transition-colors border border-white/5"
                    >
                      <p className="text-sm font-medium text-white">Help & Support</p>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 transition-colors border border-white/5"
                    >
                      <p className="text-sm font-medium text-white">Terms of Service</p>
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-white/10 transition-colors border border-white/5"
                    >
                      <p className="text-sm font-medium text-white">Privacy Policy</p>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Bottom Navigation Bar - Themed */}
      <div
        className="flex-shrink-0 bg-[#0B0E11]/85 backdrop-blur-2xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.35)] z-20 relative overflow-hidden"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          minHeight: 'calc(4rem + env(safe-area-inset-bottom, 0px))'
        }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -left-10 -top-6 w-32 h-32 bg-[#7c5dff]/25 blur-[60px]" />
          <div className="absolute right-0 -bottom-10 w-32 h-32 bg-[#f472b6]/25 blur-[70px]" />
        </div>

        <div className="grid grid-cols-5 h-16 relative px-1 gap-1">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('wallet')}
            className={`relative flex flex-col items-center justify-center rounded-xl py-2 px-2 transition-all duration-200 group ${
              activeTab === 'wallet' ? 'text-white' : 'text-gray-300'
            }`}
          >
            <div
              className={`absolute inset-0 rounded-xl blur-sm transition-opacity ${
                activeTab === 'wallet' ? 'opacity-30 bg-gradient-to-br from-[#7c5dff] via-[#5eead4] to-[#22d3ee]' : 'opacity-0 group-hover:opacity-10 bg-white/10'
              }`}
            />
            <Wallet
              className={`w-5 h-5 mb-1 relative ${
                activeTab === 'wallet' ? 'text-white drop-shadow-[0_0_8px_rgba(124,93,255,0.45)]' : 'text-gray-300 group-hover:text-white'
              }`}
              strokeWidth={activeTab === 'wallet' ? 2.5 : 2}
            />
            <span
              className={`text-[11px] font-semibold tracking-tight relative ${
                activeTab === 'wallet' ? 'text-white drop-shadow-[0_0_6px_rgba(124,93,255,0.45)]' : 'text-gray-300 group-hover:text-white'
              }`}
            >
              Wallet
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('swap')}
            className={`relative flex flex-col items-center justify-center rounded-xl py-2 px-2 transition-all duration-200 group ${
              activeTab === 'swap' ? 'text-white' : 'text-gray-300'
            }`}
          >
            <div
              className={`absolute inset-0 rounded-xl blur-sm transition-opacity ${
                activeTab === 'swap' ? 'opacity-30 bg-gradient-to-br from-[#a855f7] via-[#f472b6] to-[#fb7185]' : 'opacity-0 group-hover:opacity-10 bg-white/10'
              }`}
            />
            <ArrowLeftRight
              className={`w-5 h-5 mb-1 relative ${
                activeTab === 'swap' ? 'text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.45)]' : 'text-gray-300 group-hover:text-white'
              }`}
              strokeWidth={activeTab === 'swap' ? 2.5 : 2}
            />
            <span
              className={`text-[11px] font-semibold tracking-tight relative ${
                activeTab === 'swap' ? 'text-white drop-shadow-[0_0_6px_rgba(168,85,247,0.45)]' : 'text-gray-300 group-hover:text-white'
              }`}
            >
              Swap
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('airdrop')}
            className={`relative flex flex-col items-center justify-center rounded-xl py-2 px-2 transition-all duration-200 group ${
              activeTab === 'airdrop' ? 'text-white' : 'text-gray-300'
            }`}
          >
            <div
              className={`absolute inset-0 rounded-xl blur-sm transition-opacity ${
                activeTab === 'airdrop' ? 'opacity-30 bg-gradient-to-br from-[#34d399] via-[#22d3ee] to-[#60a5fa]' : 'opacity-0 group-hover:opacity-10 bg-white/10'
              }`}
            />
            <Gift
              className={`w-5 h-5 mb-1 relative ${
                activeTab === 'airdrop' ? 'text-white drop-shadow-[0_0_8px_rgba(52,211,153,0.45)]' : 'text-gray-300 group-hover:text-white'
              }`}
              strokeWidth={activeTab === 'airdrop' ? 2.5 : 2}
            />
            <span
              className={`text-[11px] font-semibold tracking-tight relative ${
                activeTab === 'airdrop' ? 'text-white drop-shadow-[0_0_6px_rgba(52,211,153,0.45)]' : 'text-gray-300 group-hover:text-white'
              }`}
            >
              Airdrop
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('invite')}
            className={`relative flex flex-col items-center justify-center rounded-xl py-2 px-2 transition-all duration-200 group ${
              activeTab === 'invite' ? 'text-white' : 'text-gray-300'
            }`}
          >
            <div
              className={`absolute inset-0 rounded-xl blur-sm transition-opacity ${
                activeTab === 'invite' ? 'opacity-30 bg-gradient-to-br from-[#22d3ee] via-[#6366f1] to-[#a855f7]' : 'opacity-0 group-hover:opacity-10 bg-white/10'
              }`}
            />
            <Users
              className={`w-5 h-5 mb-1 relative ${
                activeTab === 'invite' ? 'text-white drop-shadow-[0_0_8px_rgba(99,102,241,0.45)]' : 'text-gray-300 group-hover:text-white'
              }`}
              strokeWidth={activeTab === 'invite' ? 2.5 : 2}
            />
            <span
              className={`text-[11px] font-semibold tracking-tight relative ${
                activeTab === 'invite' ? 'text-white drop-shadow-[0_0_6px_rgba(99,102,241,0.45)]' : 'text-gray-300 group-hover:text-white'
              }`}
            >
              Invite
            </span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setActiveTab('activity')}
            className={`relative flex flex-col items-center justify-center rounded-xl py-2 px-2 transition-all duration-200 group ${
              activeTab === 'activity' ? 'text-white' : 'text-gray-300'
            }`}
          >
            <div
              className={`absolute inset-0 rounded-xl blur-sm transition-opacity ${
                activeTab === 'activity' ? 'opacity-30 bg-gradient-to-br from-[#f59e0b] via-[#f97316] to-[#ef4444]' : 'opacity-0 group-hover:opacity-10 bg-white/10'
              }`}
            />
            <Activity
              className={`w-5 h-5 mb-1 relative ${
                activeTab === 'activity' ? 'text-white drop-shadow-[0_0_8px_rgba(245,158,11,0.45)]' : 'text-gray-300 group-hover:text-white'
              }`}
              strokeWidth={activeTab === 'activity' ? 2.5 : 2}
            />
            <span
              className={`text-[11px] font-semibold tracking-tight relative ${
                activeTab === 'activity' ? 'text-white drop-shadow-[0_0_6px_rgba(245,158,11,0.45)]' : 'text-gray-300 group-hover:text-white'
              }`}
            >
              Activity
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  )
}

