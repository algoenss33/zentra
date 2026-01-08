"use client"

import { useState, useEffect, useRef } from 'react'

interface CryptoPrice {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_24h: number
  last_updated: string
}

interface CryptoPrices {
  [key: string]: {
    price: number
    change24h: number
    lastUpdated: string
  }
}

// Map our token symbols to various API IDs
const COINGECKO_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  SOL: 'solana',
}

const COINCAP_IDS: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
  SOL: 'solana',
}

const BINANCE_SYMBOLS: Record<string, string> = {
  BTC: 'BTCUSDT',
  ETH: 'ETHUSDT',
  USDT: 'USDTUSDT', // Will be handled specially
  SOL: 'SOLUSDT',
}

// Fallback prices (updated to more current market prices)
const FALLBACK_PRICES: Record<string, { price: number; change24h: number }> = {
  BTC: { price: 95000, change24h: 2.5 },
  ETH: { price: 3500, change24h: 1.8 },
  USDT: { price: 1.0, change24h: 0.01 },
  SOL: { price: 150, change24h: 3.2 },
}

// API URLs
const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3/simple/price'
const COINCAP_API_URL = 'https://api.coincap.io/v2/assets'
const BINANCE_API_URL = 'https://api.binance.com/api/v3/ticker/24hr'

// Circuit breaker state
interface CircuitBreakerState {
  failures: number
  lastFailureTime: number
  isOpen: boolean
}

const circuitBreakers = new Map<string, CircuitBreakerState>()

// Initialize circuit breakers
Object.keys(COINGECKO_IDS).forEach(() => {
  circuitBreakers.set('coingecko', { failures: 0, lastFailureTime: 0, isOpen: false })
  circuitBreakers.set('coincap', { failures: 0, lastFailureTime: 0, isOpen: false })
  circuitBreakers.set('binance', { failures: 0, lastFailureTime: 0, isOpen: false })
})

const CIRCUIT_BREAKER_THRESHOLD = 3 // Open after 3 failures (more sensitive)
const CIRCUIT_BREAKER_RESET_TIME = 300000 // Reset after 5 minutes (longer cooldown for rate limits)

function checkCircuitBreaker(apiName: string): boolean {
  const breaker = circuitBreakers.get(apiName)
  if (!breaker) return true

  if (breaker.isOpen) {
    const timeSinceLastFailure = Date.now() - breaker.lastFailureTime
    if (timeSinceLastFailure > CIRCUIT_BREAKER_RESET_TIME) {
      // Reset circuit breaker
      breaker.isOpen = false
      breaker.failures = 0
      return true
    }
    return false
  }
  return true
}

function recordFailure(apiName: string) {
  const breaker = circuitBreakers.get(apiName)
  if (!breaker) return

  breaker.failures++
  breaker.lastFailureTime = Date.now()

  if (breaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    breaker.isOpen = true
    console.warn(`⚠️ Circuit breaker opened for ${apiName}`)
  }
}

function recordSuccess(apiName: string) {
  const breaker = circuitBreakers.get(apiName)
  if (!breaker) return

  breaker.failures = 0
  breaker.isOpen = false
}

// Retry with exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError || new Error('Max retries exceeded')
}

// Fetch from CoinGecko
async function fetchFromCoinGecko(): Promise<CryptoPrices | null> {
  if (!checkCircuitBreaker('coingecko')) {
    return null
  }

  try {
    const ids = Object.values(COINGECKO_IDS).join(',')
    const apiUrl = `${COINGECKO_API_URL}?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      // Handle rate limiting specifically
      if (response.status === 429) {
        // Rate limit exceeded - open circuit breaker for longer
        recordFailure('coingecko')
        const breaker = circuitBreakers.get('coingecko')
        if (breaker) {
          breaker.lastFailureTime = Date.now()
          breaker.isOpen = true
        }
        throw new Error('CoinGecko rate limit exceeded (429). Please wait before retrying.')
      }
      throw new Error(`CoinGecko HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const newPrices: CryptoPrices = {}

    Object.entries(COINGECKO_IDS).forEach(([symbol, coinId]) => {
      const coinData = data[coinId]
      if (coinData && coinData.usd) {
        newPrices[symbol] = {
          price: coinData.usd || 0,
          change24h: coinData.usd_24h_change || 0,
          lastUpdated: coinData.last_updated_at
            ? new Date(coinData.last_updated_at * 1000).toISOString()
            : new Date().toISOString(),
        }
      }
    })

    if (Object.keys(newPrices).length > 0) {
      recordSuccess('coingecko')
      console.log('✅ CoinGecko: Prices fetched successfully')
      return newPrices
    }

    throw new Error('No valid prices from CoinGecko')
  } catch (error) {
    recordFailure('coingecko')
    console.warn('❌ CoinGecko failed:', error instanceof Error ? error.message : String(error))
    return null
  }
}

// Fetch from CoinCap
async function fetchFromCoinCap(): Promise<CryptoPrices | null> {
  if (!checkCircuitBreaker('coincap')) {
    return null
  }

  try {
    const ids = Object.values(COINCAP_IDS).join(',')
    const apiUrl = `${COINCAP_API_URL}?ids=${ids}`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      cache: 'no-store',
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`CoinCap HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    const newPrices: CryptoPrices = {}

    if (data.data && Array.isArray(data.data)) {
      const symbolMap: Record<string, string> = {}
      Object.entries(COINCAP_IDS).forEach(([symbol, id]) => {
        symbolMap[id] = symbol
      })

      data.data.forEach((coin: any) => {
        const symbol = symbolMap[coin.id]
        if (symbol && coin.priceUsd) {
          newPrices[symbol] = {
            price: parseFloat(coin.priceUsd) || 0,
            change24h: parseFloat(coin.changePercent24Hr) || 0,
            lastUpdated: new Date().toISOString(),
          }
        }
      })
    }

    if (Object.keys(newPrices).length > 0) {
      recordSuccess('coincap')
      console.log('✅ CoinCap: Prices fetched successfully')
      return newPrices
    }

    throw new Error('No valid prices from CoinCap')
  } catch (error) {
    recordFailure('coincap')
    console.warn('❌ CoinCap failed:', error instanceof Error ? error.message : String(error))
    return null
  }
}

// Fetch from Binance
async function fetchFromBinance(): Promise<CryptoPrices | null> {
  if (!checkCircuitBreaker('binance')) {
    return null
  }

  try {
    // Fetch each symbol individually (more reliable than batch)
    const symbolPromises = Object.entries(BINANCE_SYMBOLS).map(async ([symbol, binanceSymbol]) => {
      try {
        // Special handling for USDT - it's a stablecoin, return fixed price
        if (symbol === 'USDT') {
          return {
            symbol,
            price: 1.0,
            change24h: 0.01,
          }
        }

        const apiUrl = `${BINANCE_API_URL}?symbol=${binanceSymbol}`
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch(apiUrl, {
          signal: controller.signal,
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          cache: 'no-store',
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Binance HTTP error! status: ${response.status}`)
        }

        const ticker = await response.json()
        
        if (ticker && ticker.lastPrice) {
          const price = parseFloat(ticker.lastPrice)
          const prevPrice = parseFloat(ticker.prevClosePrice || ticker.lastPrice)
          const change24h = prevPrice > 0 ? ((price - prevPrice) / prevPrice) * 100 : 0

          return {
            symbol,
            price: price || 0,
            change24h: change24h || 0,
          }
        }
        return null
      } catch (error) {
        console.warn(`Binance fetch failed for ${symbol}:`, error)
        return null
      }
    })

    const results = await Promise.allSettled(symbolPromises)
    const newPrices: CryptoPrices = {}

    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value) {
        const { symbol, price, change24h } = result.value
        if (price > 0) {
          newPrices[symbol] = {
            price,
            change24h,
            lastUpdated: new Date().toISOString(),
          }
        }
      }
    })

    if (Object.keys(newPrices).length > 0) {
      recordSuccess('binance')
      console.log('✅ Binance: Prices fetched successfully')
      return newPrices
    }

    throw new Error('No valid prices from Binance')
  } catch (error) {
    recordFailure('binance')
    console.warn('❌ Binance failed:', error instanceof Error ? error.message : String(error))
    return null
  }
}

// Merge prices from multiple sources
function mergePrices(...priceSources: (CryptoPrices | null)[]): CryptoPrices {
  const merged: CryptoPrices = {}
  const symbols = Object.keys(COINGECKO_IDS)

  symbols.forEach(symbol => {
    // Use first available price from sources
    for (const prices of priceSources) {
      if (prices && prices[symbol] && prices[symbol].price > 0) {
        merged[symbol] = prices[symbol]
        break
      }
    }
  })

  return merged
}

export function useCryptoPrices() {
  const [prices, setPrices] = useState<CryptoPrices>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const lastFetchTime = useRef<number>(0)
  const isFetching = useRef<boolean>(false) // Prevent multiple simultaneous fetches
  const CACHE_DURATION = 30000 // Cache for 30 seconds (increased to reduce API calls)

  const fetchPrices = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetching.current) {
      return
    }

    // Check cache
    const now = Date.now()
    if (now - lastFetchTime.current < CACHE_DURATION && Object.keys(prices).length > 0) {
      return
    }

    isFetching.current = true

    try {
      setError(null)
      // Don't set loading to true if we already have prices (to avoid UI flicker)
      if (Object.keys(prices).length === 0) {
        setLoading(true)
      }

      // Try all APIs in parallel with retry - wrap in try-catch to prevent crashes
      let coingeckoPrices: PromiseSettledResult<CryptoPrices | null>
      let coincapPrices: PromiseSettledResult<CryptoPrices | null>
      let binancePrices: PromiseSettledResult<CryptoPrices | null>

      try {
        [coingeckoPrices, coincapPrices, binancePrices] = await Promise.allSettled([
          retryWithBackoff(() => fetchFromCoinGecko(), 2, 1000).catch(() => null),
          retryWithBackoff(() => fetchFromCoinCap(), 2, 1000).catch(() => null),
          retryWithBackoff(() => fetchFromBinance(), 2, 1000).catch(() => null),
        ])
      } catch (error) {
        console.warn('Error fetching prices from APIs:', error)
        // Continue with empty results - will use fallback prices
        coingeckoPrices = { status: 'rejected', reason: error }
        coincapPrices = { status: 'rejected', reason: error }
        binancePrices = { status: 'rejected', reason: error }
      }

      const priceSources: (CryptoPrices | null)[] = []

      if (coingeckoPrices.status === 'fulfilled' && coingeckoPrices.value) {
        priceSources.push(coingeckoPrices.value)
      }
      if (coincapPrices.status === 'fulfilled' && coincapPrices.value) {
        priceSources.push(coincapPrices.value)
      }
      if (binancePrices.status === 'fulfilled' && binancePrices.value) {
        priceSources.push(binancePrices.value)
      }

      // Merge prices from all sources
      const mergedPrices = mergePrices(...priceSources)

      // Fill missing prices with fallback
      const finalPrices: CryptoPrices = { ...mergedPrices }
      Object.entries(COINGECKO_IDS).forEach(([symbol]) => {
        if (!finalPrices[symbol] || finalPrices[symbol].price === 0) {
          const fallback = FALLBACK_PRICES[symbol]
          if (fallback) {
            finalPrices[symbol] = {
              price: fallback.price,
              change24h: fallback.change24h,
              lastUpdated: new Date().toISOString(),
            }
            console.warn(`⚠️ ${symbol} using fallback price: $${fallback.price}`)
          }
        }
      })

      setPrices(finalPrices)
      lastFetchTime.current = now

      if (Object.keys(mergedPrices).length === 0) {
        setError('All APIs failed, using fallback prices')
      } else if (Object.keys(mergedPrices).length < Object.keys(COINGECKO_IDS).length) {
        setError('Some prices unavailable, using fallback for missing tokens')
      } else {
        setError(null)
      }
    } catch (err) {
      // Silently handle errors - don't crash the app
      console.warn('Error in fetchPrices (using fallback):', err)

      // Use fallback prices - ensure we always have prices
      const fallbackPrices: CryptoPrices = {}
      try {
        Object.entries(COINGECKO_IDS).forEach(([symbol]) => {
          const fallback = FALLBACK_PRICES[symbol]
          if (fallback) {
            fallbackPrices[symbol] = {
              price: fallback.price,
              change24h: fallback.change24h,
              lastUpdated: new Date().toISOString(),
            }
          }
        })
        setPrices(fallbackPrices)
        // Don't set error state - silently use fallback
      } catch (fallbackError) {
        console.error('Critical error setting fallback prices:', fallbackError)
        // Even if fallback fails, ensure we have empty prices object
        setPrices({})
      }
    } finally {
      setLoading(false)
      isFetching.current = false
    }
  }

  useEffect(() => {
    // Initialize with fallback prices immediately to prevent loading state
    const initialPrices: CryptoPrices = {}
    Object.entries(COINGECKO_IDS).forEach(([symbol]) => {
      const fallback = FALLBACK_PRICES[symbol]
      if (fallback) {
        initialPrices[symbol] = {
          price: fallback.price,
          change24h: fallback.change24h,
          lastUpdated: new Date().toISOString(),
        }
      }
    })
    setPrices(initialPrices)
    setLoading(false)

    // Fetch prices in background (non-blocking)
    let isMounted = true
    const fetchInBackground = async () => {
      try {
        await fetchPrices()
      } catch (error) {
        // Silently handle - already have fallback prices
        if (isMounted) {
          console.warn('Background price fetch failed, using fallback')
        }
      }
    }

    // Fetch immediately in background
    fetchInBackground()

    // Set up interval to fetch every 120 seconds (2 minutes) to avoid rate limits
    // CoinGecko free tier: 10-50 calls/minute, so 2 minutes is safe
    const interval = setInterval(() => {
      if (isMounted) {
        fetchInBackground()
      }
    }, 120000) // 2 minutes instead of 1 minute

    // Cleanup interval on unmount
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const getPrice = (symbol: string): number | null => {
    try {
      if (!symbol || !prices) return null
      const price = prices[symbol]?.price
      if (price === undefined || price === null || price === 0 || isNaN(price)) return null
      return price
    } catch (error) {
      console.warn('Error getting price for', symbol, error)
      return null
    }
  }

  const getChange24h = (symbol: string): number | null => {
    try {
      if (!symbol || !prices) return null
      const change = prices[symbol]?.change24h
      if (change === undefined || change === null || isNaN(change)) return null
      return change
    } catch (error) {
      console.warn('Error getting change24h for', symbol, error)
      return null
    }
  }

  const formatPrice = (symbol: string): string => {
    try {
      if (!symbol) return '--'
      const price = getPrice(symbol)
      if (price === null) {
        // Return fallback price if available
        const fallback = FALLBACK_PRICES[symbol]
        if (fallback) {
          if (fallback.price >= 1000) {
            return `$${fallback.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          } else if (fallback.price >= 1) {
            return `$${fallback.price.toFixed(2)}`
          } else {
            return `$${fallback.price.toFixed(4)}`
          }
        }
        return '--'
      }

      // Format based on price magnitude
      if (price >= 1000) {
        return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      } else if (price >= 1) {
        return `$${price.toFixed(2)}`
      } else {
        return `$${price.toFixed(4)}`
      }
    } catch (error) {
      console.warn('Error formatting price for', symbol, error)
      return '--'
    }
  }

  const formatChange24h = (symbol: string): string => {
    try {
      if (!symbol) return '--'
      const change = getChange24h(symbol)
      if (change === null) {
        // Return fallback change if available
        const fallback = FALLBACK_PRICES[symbol]
        if (fallback) {
          const sign = fallback.change24h >= 0 ? '+' : ''
          return `${sign}${fallback.change24h.toFixed(2)}%`
        }
        return '--'
      }

      const sign = change >= 0 ? '+' : ''
      return `${sign}${change.toFixed(2)}%`
    } catch (error) {
      console.warn('Error formatting change24h for', symbol, error)
      return '--'
    }
  }

  return {
    prices,
    loading,
    error,
    getPrice,
    getChange24h,
    formatPrice,
    formatChange24h,
  }
}
