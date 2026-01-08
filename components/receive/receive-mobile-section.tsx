"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Copy, Check, QrCode, Download } from "lucide-react"
import { useWalletAddress } from "@/hooks/use-wallet-address"
import { toast } from "sonner"
import QRCode from "qrcode"

interface ReceiveMobileSectionProps {
  onBack?: () => void
}

export function ReceiveMobileSection({ onBack }: ReceiveMobileSectionProps) {
  const { address, loading } = useWalletAddress()
  const [copied, setCopied] = useState(false)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)

  // Generate QR code when address is available
  useEffect(() => {
    if (address && !qrCodeDataUrl) {
      QRCode.toDataURL(address, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
        .then((url) => {
          setQrCodeDataUrl(url)
        })
        .catch((err) => {
          console.error('Error generating QR code:', err)
        })
    }
  }, [address, qrCodeDataUrl])

  const handleCopy = async () => {
    if (!address) return

    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      toast.success("Address copied to clipboard")
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error("Failed to copy address")
    }
  }

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return

    const link = document.createElement('a')
    link.download = `wallet-address-qr-${address?.slice(0, 10)}.png`
    link.href = qrCodeDataUrl
    link.click()
    toast.success("QR code downloaded")
  }

  if (!address) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d]">
        <div className="text-center">
          <p className="text-gray-300 text-sm">Please login to view your wallet address</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-[#0d1020] via-[#0b0e11] to-[#04060d] flex flex-col min-h-0 overflow-hidden">
      {/* Ambient gradient blobs */}
      <div className="absolute -top-24 -left-20 w-64 h-64 bg-[#34d399]/30 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-16 -right-12 w-56 h-56 bg-[#22d3ee]/25 blur-[110px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-[#60a5fa]/10 blur-[140px] pointer-events-none" />

      <div className="relative h-full flex flex-col z-10">
        {/* Header */}
        <div className="px-4 pt-8 pb-3 bg-[#0B0E11]/80 backdrop-blur-lg border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (onBack) {
                    onBack()
                  } else {
                    if (window.history.length > 1) {
                      window.history.back()
                    }
                  }
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </motion.button>
              <h1 className="text-xl font-semibold text-white tracking-tight">Receive</h1>
            </div>
          </div>
        </div>

        {/* Content - Full screen, scrollable without scrollbar */}
        <div className="flex-1 overflow-y-auto scrollbar-hidden flex flex-col items-center justify-center px-4 pb-4 min-h-0" style={{
          paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}>
          {/* QR Code - Centered and prominent */}
          <div className="flex flex-col items-center justify-center flex-1 w-full max-w-sm">
            <div className="text-center mb-6">
              <p className="text-xs text-gray-300 mb-1 font-normal">Your Wallet Address</p>
              <p className="text-sm text-gray-400">Scan to receive funds</p>
            </div>

            {/* QR Code Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-white p-6 rounded-2xl shadow-[0_12px_35px_rgba(0,0,0,0.35)] border-2 border-white/20 mb-6"
            >
              {qrCodeDataUrl ? (
                <img 
                  src={qrCodeDataUrl} 
                  alt="Wallet Address QR Code" 
                  className="w-56 h-56"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center bg-gray-50 rounded-xl">
                  <QrCode className="w-16 h-16 text-gray-300 animate-pulse" />
                </div>
              )}
            </motion.div>

            {/* Address Display - Compact */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="w-full max-w-sm"
            >
              <div className="bg-gradient-to-br from-white/10 via-white/5 to-white/5 rounded-xl p-3 mb-4 border border-white/10 backdrop-blur-lg">
                <div className="flex items-center gap-2">
                  <p className="text-[10px] font-mono text-white break-all flex-1 leading-tight">
                    {address}
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCopy}
                    className="flex-shrink-0 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors border border-white/10"
                    title="Copy address"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white" />
                    )}
                  </motion.button>
                </div>
              </div>

              {/* Action Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#34d399] via-[#22d3ee] to-[#60a5fa] text-white rounded-xl font-semibold shadow-[0_12px_35px_rgba(52,211,153,0.45)] hover:shadow-[0_14px_40px_rgba(52,211,153,0.55)] transition-all duration-200"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    <span>Copy Address</span>
                  </>
                )}
              </motion.button>
            </motion.div>

            {/* Simple Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="mt-6 text-center"
            >
              <p className="text-[10px] text-gray-400 leading-relaxed">
                Only send funds to this address.<br />
                Double-check before sending.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

