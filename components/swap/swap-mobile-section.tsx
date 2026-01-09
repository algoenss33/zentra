"use client"

import { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Settings, ChevronDown, ArrowUpDown, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useBalance } from "@/hooks/use-balance"
import { useCryptoPrices } from "@/hooks/use-crypto-prices"
import { supabase } from "@/lib/supabase/client"
import { toast } from "sonner"
import Image from "next/image"

interface Token {
  symbol: string
  name: string
  image: string
  decimals: number
}

const AVAILABLE_TOKENS: Token[] = [
  { symbol: 'ZENTRA', name: 'Zentra', image: '/chain/zentra.png', decimals: 0 },
  { symbol: 'BTC', name: 'Bitcoin', image: '/chain/bitcoin.png', decimals: 4 },
  { symbol: 'ETH', name: 'Ethereum', image: '/chain/ethereum.png', decimals: 4 },
  { symbol: 'USDT', name: 'Tether', image: '/chain/Tether.png', decimals: 4 },
  { symbol: 'USDC', name: 'USD Coin', image: '/chain/usdc.png', decimals: 4 },
  { symbol: 'SOL', name: 'Solana', image: '/chain/solana.png', decimals: 4 },
  { symbol: 'BNB', name: 'BNB', image: '/chain/bnb-icon2_2x.png', decimals: 4 },
  { symbol: 'TRX', name: 'Tron', image: '/chain/tron-logo.png', decimals: 4 },
  { symbol: 'XRP', name: 'Ripple', image: '/chain/xrp-symbol-white-128.png', decimals: 4 },
  { symbol: 'DOGE', name: 'Dogecoin', image: '/chain/dogecoin.png', decimals: 4 },
  { symbol: 'STETH', name: 'Staked ETH', image: '/chain/steth_logo.png', decimals: 4 },
]

interface SwapMobileSectionProps {
  onBack?: () => void
}

export function SwapMobileSection({ onBack }: SwapMobileSectionProps) {
  const { profile } = useAuth()
  const { getBalance, reloadBalances } = useBalance()
  const { getPrice } = useCryptoPrices()
  const [fromToken, setFromToken] = useState<Token>(AVAILABLE_TOKENS[0])
  const [toToken, setToToken] = useState<Token>(AVAILABLE_TOKENS.find(token => token.symbol === 'USDT') || AVAILABLE_TOKENS[1])
  const [fromAmount, setFromAmount] = useState<string>('')
  const [toAmount, setToAmount] = useState<string>('')
  const [slippage, setSlippage] = useState<number>(2)
  const [showSlippageSettings, setShowSlippageSettings] = useState(false)
  const [showFromTokenSelector, setShowFromTokenSelector] = useState(false)
  const [showToTokenSelector, setShowToTokenSelector] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)

  // Get balances with proper formatting
  const fromBalanceRaw = getBalance(fromToken.symbol)
  const toBalanceRaw = getBalance(toToken.symbol)
  const fromBalance = fromBalanceRaw || 0
  const toBalance = toBalanceRaw || 0

  // Format balance display helper
  const formatBalance = (balance: number, decimals: number): string => {
    if (balance === 0 || balance === null || balance === undefined) return '0'
    if (decimals === 0) {
      // For ZENTRA and other whole number tokens
      return Math.floor(balance).toString()
    }
    // For tokens with decimals
    return balance.toFixed(decimals)
  }

  // Check if balance is available
  const isBalanceAvailable = (balance: number): boolean => {
    return balance !== null && balance !== undefined && balance > 0
  }

  // Fallback prices for all tokens (consistent across app)
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

  // Get token prices with fallbacks and error handling
  const getTokenPrice = (symbol: string): number => {
    try {
      if (symbol === 'ZENTRA') return FALLBACK_PRICES.ZENTRA
      const price = getPrice(symbol)
      if (price !== null && price > 0 && !isNaN(price)) return price
      
      // Use fallback price
      return FALLBACK_PRICES[symbol] || 0
    } catch (error) {
      console.warn('Error getting token price for', symbol, error)
      // Return safe fallback
      return FALLBACK_PRICES[symbol] || 0
    }
  }

  const fromPrice = getTokenPrice(fromToken.symbol)
  const toPrice = getTokenPrice(toToken.symbol)

  // Calculate exchange rate
  // Exchange rate: how many toToken you get for 1 fromToken
  // Formula: fromPrice / toPrice (e.g., if ZENTRA = $0.5 and BTC = $95000, then 1 ZENTRA = 0.5/95000 = 0.00000526 BTC)
  const exchangeRate = useMemo(() => {
    if (fromPrice === 0 || toPrice === 0) {
      return 0
    }
    return fromPrice / toPrice
  }, [fromPrice, toPrice])

  // Get stable decimals value
  const toTokenDecimals = useMemo(() => toToken.decimals, [toToken.decimals])

  // Calculate to amount based on from amount
  // Also calculate the expected USD value to ensure consistency
  const [toAmountUsdValue, setToAmountUsdValue] = useState<number>(0)
  
  useEffect(() => {
    if (fromAmount && !isNaN(parseFloat(fromAmount)) && exchangeRate > 0 && fromPrice > 0 && toPrice > 0) {
      const fromAmountNum = parseFloat(fromAmount)
      // Calculate: fromAmount * exchangeRate = amount of toToken you get
      const calculated = fromAmountNum * exchangeRate
      // Apply slippage: minReceived = calculated * (1 - slippage%)
      const minReceived = calculated * (1 - slippage / 100)
      
      // Calculate USD value using the SAME toPrice used in exchange rate
      // This ensures consistency between the amount and its USD value
      const usdValue = minReceived * toPrice
      setToAmountUsdValue(usdValue)
      
      // Use toToken.decimals, not fromToken.decimals!
      const formattedAmount = minReceived.toFixed(toTokenDecimals)
      setToAmount(formattedAmount)
    } else {
      setToAmount('')
      setToAmountUsdValue(0)
    }
  }, [fromAmount, exchangeRate, slippage, toTokenDecimals, fromPrice, toPrice, fromToken.symbol, toToken.symbol])

  const handleSwapDirection = () => {
    const tempToken = fromToken
    const tempAmount = fromAmount
    setFromToken(toToken)
    setToToken(tempToken)
    setFromAmount(toAmount)
    setToAmount(tempAmount)
    setToAmountUsdValue(0) // Reset USD value when swapping direction
  }

  const handleMaxClick = () => {
    if (fromBalance > 0) {
      setFromAmount(formatBalance(fromBalance, fromToken.decimals))
    }
  }

  const handleSwap = async () => {
    if (!profile) {
      toast.error('Please login to swap')
      return
    }

    const fromAmountNum = parseFloat(fromAmount)
    if (isNaN(fromAmountNum) || fromAmountNum <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (fromAmountNum > fromBalance) {
      toast.error('Insufficient balance')
      return
    }

    // Prevent double-clicking
    if (isSwapping) {
      return
    }

    setIsSwapping(true)

    // Timeout safety - force reset after 30 seconds
    const timeoutId = setTimeout(() => {
      setIsSwapping(false)
      toast.error('Swap timeout - please try again')
    }, 30000)

    try {
      const toAmountNum = parseFloat(toAmount)
      if (isNaN(toAmountNum) || toAmountNum <= 0) {
        throw new Error('Invalid swap amount')
      }

      const fromUsdValue = fromAmountNum * fromPrice
      const toUsdValue = toAmountNum * toPrice

      // Update from token balance (subtract) - with timeout
      const fromBalancePromise = supabase
        .from('balances')
        .select('*')
        .eq('user_id', profile.id)
        .eq('token', fromToken.symbol)
        .single()

      const fromBalanceResult = await Promise.race([
        fromBalancePromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]) as { data: any, error: any }

      if (fromBalanceResult.error || !fromBalanceResult.data) {
        throw new Error('Balance not found')
      }

      const fromBalanceData = fromBalanceResult.data
      const newFromBalance = fromBalanceData.balance - fromAmountNum
      if (newFromBalance < 0) {
        throw new Error('Insufficient balance')
      }

      // Update from token balance - with timeout
      // @ts-ignore - Supabase type issue
      const updateFromPromise = supabase
        .from('balances')
        // @ts-ignore
        .update({ balance: newFromBalance, updated_at: new Date().toISOString() })
        .eq('id', fromBalanceData.id)

      const updateFromResult = await Promise.race([
        updateFromPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]) as { error: any }

      if (updateFromResult.error) {
        throw updateFromResult.error
      }

      // Update to token balance (add) - with timeout
      const toBalancePromise = supabase
        .from('balances')
        .select('*')
        .eq('user_id', profile.id)
        .eq('token', toToken.symbol)
        .single()

      const toBalanceResult = await Promise.race([
        toBalancePromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]) as { data: any, error: any }

      if (toBalanceResult.data) {
        const toBalanceData = toBalanceResult.data
        // @ts-ignore - Supabase type issue
        const updateToPromise = supabase
          .from('balances')
          // @ts-ignore
          .update({ balance: toBalanceData.balance + toAmountNum, updated_at: new Date().toISOString() })
          .eq('id', toBalanceData.id)
        
        const updateToResult = await Promise.race([
          updateToPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          )
        ]) as { error: any }

        if (updateToResult.error) {
          throw updateToResult.error
        }
      } else {
        // Create new balance if doesn't exist - with timeout
        // @ts-ignore - Supabase type issue
        const createToPromise = supabase
          .from('balances')
          // @ts-ignore
          .insert({
            user_id: profile.id,
            token: toToken.symbol,
            balance: toAmountNum,
          })
        
        const createToResult = await Promise.race([
          createToPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 10000)
          )
        ]) as { error: any }

        if (createToResult.error) {
          throw createToResult.error
        }
      }

      // Create transaction record for swap (non-blocking - don't fail swap if this fails)
      // Only create one 'swap' transaction instead of 'send' and 'receive'
      // 'send' transactions are excluded from activity (only popup notification)
      try {
        // @ts-ignore - Supabase type issue
        await Promise.race([
          // @ts-ignore
          supabase
            .from('transactions')
            // @ts-ignore
            .insert({
              user_id: profile.id,
              type: 'swap',
              token: toToken.symbol,
              amount: toAmountNum,
              usd_value: toUsdValue,
              status: 'confirmed',
            }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Transaction timeout')), 5000)
          )
        ]).catch((transactionError) => {
          // Log error but don't fail the swap - balance already updated
          console.warn('Failed to create transaction records (non-critical):', transactionError)
        })
      } catch (transactionError) {
        // Log error but don't fail the swap - balance already updated
        console.warn('Failed to create transaction records (non-critical):', transactionError)
      }

      clearTimeout(timeoutId)
      
      toast.success(`Swapped ${fromAmount} ${fromToken.symbol} for ${toAmount} ${toToken.symbol}`)
      setFromAmount('')
      setToAmount('')
      setToAmountUsdValue(0)

      // Immediately refresh balances to show updated values
      try {
        await reloadBalances()
      } catch (refreshError) {
        console.warn('Failed to refresh balances (non-critical):', refreshError)
      }

      // Trigger balance update to sync wallet immediately (realtime subscription will handle the rest)
      window.dispatchEvent(new Event('balance-updated'))
      window.dispatchEvent(new Event('transaction-updated'))
    } catch (error: any) {
      clearTimeout(timeoutId)
      console.error('Error swapping:', error)
      const errorMessage = error?.message || 'Failed to swap tokens. Please try again.'
      toast.error(errorMessage)
    } finally {
      // Always reset swapping state - ensure it's reset even if error occurs
      setIsSwapping(false)
    }
  }

  const minReceived = useMemo(() => {
    if (!toAmount) return '0'
    const amount = parseFloat(toAmount)
    return (amount * (1 - slippage / 100)).toFixed(toToken.decimals)
  }, [toAmount, slippage, toToken.decimals])

  const canSwap = fromAmount && parseFloat(fromAmount) > 0 && parseFloat(fromAmount) <= fromBalance && !isSwapping

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d] text-white max-w-[390px] mx-auto overflow-hidden">
      {/* Ambient gradient blobs */}
      <div className="absolute -top-24 -left-20 w-64 h-64 bg-[#a855f7]/30 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-16 -right-12 w-56 h-56 bg-[#f472b6]/25 blur-[110px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#fb7185]/10 blur-[140px] pointer-events-none" />

      <div className="relative h-full flex flex-col">
        {/* Header */}
        <div className="px-4 pt-8 pb-4 bg-[#0B0E11]/80 backdrop-blur-lg border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (onBack) {
                    onBack()
                  } else {
                    // Fallback: try to go back in history, but don't exit app
                    if (window.history.length > 1) {
                      window.history.back()
                    }
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
              <h2 className="text-xl font-bold text-white">Swap</h2>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSlippageSettings(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-all border border-white/15 backdrop-blur-sm"
              >
                <Settings className="w-4 h-4 text-white" />
                <span className="text-sm font-medium text-white">{slippage}%</span>
              </motion.button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-white/5 border border-white/10 rounded-full p-1">
            <button className="px-4 py-2 text-sm font-semibold rounded-full bg-white/15 text-white border border-white/20 shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
              Swap
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded-full">
              Predictions
            </button>
            <button className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors rounded-full">
              Perps
            </button>
          </div>
        </div>

        {/* Content - scrollable without visible scrollbar */}
        <div
          className="flex-1 overflow-y-auto scrollbar-hidden px-4 space-y-4 pb-4 relative z-10"
          style={{
            paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
          }}
        >
        {/* From Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white/6 rounded-2xl p-4 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.3)] backdrop-blur-lg"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
            <span className="text-sm font-medium text-gray-300">From</span>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs ${
                isBalanceAvailable(fromBalance) ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Balance: {formatBalance(fromBalance, fromToken.decimals)} {fromToken.symbol}
              </span>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleMaxClick}
                disabled={!isBalanceAvailable(fromBalance)}
                className={`text-xs font-semibold px-2 py-0.5 rounded-lg transition-all flex-shrink-0 ${
                  !isBalanceAvailable(fromBalance)
                    ? 'text-gray-500 bg-white/5 cursor-not-allowed border border-white/5' 
                    : 'text-white bg-white/12 hover:bg-white/16 border border-white/20'
                }`}
              >
                Max
              </motion.button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFromTokenSelector(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl hover:bg-white/15 transition-all w-full sm:w-auto sm:min-w-[120px] border border-white/10 backdrop-blur-sm"
            >
              <div className="relative w-6 h-6 flex-shrink-0">
                <Image
                  src={fromToken.image}
                  alt={fromToken.name}
                  fill
                  className="rounded-full object-cover"
                  sizes="24px"
                />
              </div>
              <span className="font-semibold text-white text-sm sm:text-base">{fromToken.symbol}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
            </motion.button>
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="number"
                value={fromAmount}
                onChange={(e) => setFromAmount(e.target.value)}
                placeholder="0"
                className="w-full text-xl sm:text-2xl font-bold text-white bg-transparent border-none outline-none placeholder:text-gray-500"
              />
              <div className="text-xs text-gray-400 mt-1">
                {fromPrice > 0 ? `1 ${fromToken.symbol} = $${fromPrice.toFixed(4)}` : 'Price unavailable'}
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <div className="text-sm font-medium text-gray-300">
                {fromAmount && fromPrice > 0 ? `$${(parseFloat(fromAmount) * fromPrice).toFixed(2)}` : '$0.00'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Swap Direction Button */}
        <div className="flex justify-center -my-2 relative z-10">
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleSwapDirection}
            className="w-12 h-12 rounded-full bg-white/10 border border-white/20 shadow-[0_8px_20px_rgba(0,0,0,0.35)] flex items-center justify-center hover:bg-white/14 transition-all"
          >
            <ArrowUpDown className="w-5 h-5 text-white" />
          </motion.button>
        </div>

        {/* To Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white/6 rounded-2xl p-4 border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.3)] backdrop-blur-lg"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
            <span className="text-sm font-medium text-gray-300">To (estimated)</span>
            <span className={`text-xs ${
              isBalanceAvailable(toBalance) ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Balance: {formatBalance(toBalance, toToken.decimals)} {toToken.symbol}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowToTokenSelector(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl hover:bg-white/15 transition-all w-full sm:w-auto sm:min-w-[120px] border border-white/10 backdrop-blur-sm"
            >
              <div className="relative w-6 h-6 flex-shrink-0">
                <Image
                  src={toToken.image}
                  alt={toToken.name}
                  fill
                  className="rounded-full object-cover"
                  sizes="24px"
                />
              </div>
              <span className="font-semibold text-white text-sm sm:text-base">{toToken.symbol}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
            </motion.button>
            <div className="flex-1 w-full sm:w-auto">
              <input
                type="text"
                value={toAmount}
                readOnly
                placeholder="0"
                className="w-full text-xl sm:text-2xl font-bold text-white bg-transparent border-none outline-none placeholder:text-gray-500"
              />
              <div className="text-xs text-gray-400 mt-1">
                {toPrice > 0 ? `1 ${toToken.symbol} = $${toPrice.toFixed(4)}` : 'Price unavailable'}
              </div>
            </div>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <div className="text-sm font-medium text-gray-300">
                {toAmountUsdValue > 0 ? `$${toAmountUsdValue.toFixed(2)}` : '$0.00'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Swap Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="bg-white/6 rounded-xl p-4 space-y-2 border border-white/10 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Rate</span>
            <span className="font-medium text-white">
              {exchangeRate > 0 ? `1 ${fromToken.symbol} = ${exchangeRate.toFixed(6)} ${toToken.symbol}` : '--'}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Slippage</span>
            <span className="font-medium text-white">{slippage}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">Min. Received</span>
            <span className="font-medium text-white">{minReceived} {toToken.symbol}</span>
          </div>
        </motion.div>

        {/* Swap Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <motion.button
            whileTap={{ scale: canSwap && !isSwapping ? 0.98 : 1 }}
            onClick={handleSwap}
            disabled={!canSwap || isSwapping}
            className={`w-full h-14 rounded-xl text-base font-bold transition-all flex items-center justify-center gap-2 ${
              canSwap && !isSwapping
                ? 'bg-white text-[#0d1020] border border-white/60 shadow-[0_10px_28px_rgba(0,0,0,0.35)] hover:bg-white/90'
                : isSwapping
                ? 'bg-white/20 text-white border border-white/30 cursor-wait'
                : 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/10'
            }`}
          >
            {isSwapping ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                />
                <span>Swapping...</span>
              </>
            ) : !fromAmount ? (
              'Enter Amount'
            ) : fromBalance === 0 ? (
              'No Balance Available'
            ) : fromAmount && parseFloat(fromAmount) > fromBalance ? (
              'Insufficient Balance'
            ) : (
              'Swap'
            )}
          </motion.button>
        </motion.div>
      </div>

      {/* Token Selector Modal - From */}
      <AnimatePresence>
        {showFromTokenSelector && (
          <TokenSelectorModal
            tokens={AVAILABLE_TOKENS}
            selectedToken={fromToken}
            onSelect={(token) => {
              if (token.symbol === toToken.symbol) {
                setToToken(fromToken)
              }
              setFromToken(token)
              setShowFromTokenSelector(false)
            }}
            onClose={() => setShowFromTokenSelector(false)}
            getBalance={getBalance}
          />
        )}
      </AnimatePresence>

      {/* Token Selector Modal - To */}
      <AnimatePresence>
        {showToTokenSelector && (
          <TokenSelectorModal
            tokens={AVAILABLE_TOKENS}
            selectedToken={toToken}
            onSelect={(token) => {
              if (token.symbol === fromToken.symbol) {
                setFromToken(toToken)
              }
              setToToken(token)
              setShowToTokenSelector(false)
            }}
            onClose={() => setShowToTokenSelector(false)}
            getBalance={getBalance}
          />
        )}
      </AnimatePresence>

      {/* Slippage Settings Modal */}
      <AnimatePresence>
        {showSlippageSettings && (
          <SlippageSettingsModal
            slippage={slippage}
            onSlippageChange={setSlippage}
            onClose={() => setShowSlippageSettings(false)}
          />
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}

function TokenSelectorModal({
  tokens,
  selectedToken,
  onSelect,
  onClose,
  getBalance,
}: {
  tokens: Token[]
  selectedToken: Token
  onSelect: (token: Token) => void
  onClose: () => void
  getBalance: (token: string) => number
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full max-w-[100vw] bg-[#0d1020] rounded-t-3xl max-h-[85vh] overflow-hidden border-t border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5 backdrop-blur-sm sticky top-0 z-10">
          <h3 className="text-lg font-bold text-white">Select Token</h3>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/10 flex-shrink-0"
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>
        </div>
        <div className="overflow-y-auto scrollbar-hidden max-h-[calc(80vh-80px)]" style={{
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}>
          {tokens.map((token) => {
            const balance = getBalance(token.symbol)
            const isSelected = token.symbol === selectedToken.symbol
            return (
              <motion.button
                key={token.symbol}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSelect(token)}
                className={`w-full flex items-center justify-between p-3 sm:p-4 hover:bg-white/5 transition-colors border-b border-white/5 ${
                  isSelected ? 'bg-white/8 border-l-4 border-l-white/60' : ''
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <Image
                      src={token.image}
                      alt={token.name}
                      fill
                      className="rounded-full object-cover"
                      sizes="40px"
                    />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm sm:text-base truncate">{token.name}</div>
                    <div className="text-xs text-gray-400">{token.symbol}</div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <div className="text-sm font-medium text-white whitespace-nowrap">{balance.toFixed(token.decimals)}</div>
                  {isSelected && (
                    <div className="text-xs text-white mt-1 font-semibold">Selected</div>
                  )}
                </div>
              </motion.button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

function SlippageSettingsModal({
  slippage,
  onSlippageChange,
  onClose,
}: {
  slippage: number
  onSlippageChange: (value: number) => void
  onClose: () => void
}) {
  const presets = [0.5, 1, 2, 3]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#0d1020] rounded-2xl p-6 w-full max-w-sm border border-white/12 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">Slippage Tolerance</h3>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
          >
            <X className="w-5 h-5 text-white" />
          </motion.button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2">
            {presets.map((preset) => (
              <motion.button
                key={preset}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSlippageChange(preset)}
                className={`py-2 rounded-lg font-medium transition-all ${
                  slippage === preset
                    ? 'bg-white text-[#0d1020] shadow-[0_8px_20px_rgba(0,0,0,0.35)] border border-white/30'
                    : 'bg-white/10 text-gray-300 hover:bg-white/15 border border-white/10'
                }`}
              >
                {preset}%
              </motion.button>
            ))}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Custom</label>
            <input
              type="number"
              value={slippage}
              onChange={(e) => {
                const value = parseFloat(e.target.value)
                if (!isNaN(value) && value >= 0 && value <= 50) {
                  onSlippageChange(value)
                }
              }}
              step="0.1"
              min="0"
              max="50"
              className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a855f7] focus:border-[#a855f7] text-white placeholder:text-gray-500"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="w-full h-12 rounded-xl text-base font-bold bg-white text-[#0d1020] border border-white/60 shadow-[0_12px_32px_rgba(0,0,0,0.35)] hover:bg-white/90 transition-all"
          >
            Confirm
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

