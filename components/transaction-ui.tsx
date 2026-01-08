"use client"

import { motion } from "framer-motion"
import { Send, ArrowDownLeft, Copy, Clock } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

export function TransactionUI() {
  const [tab, setTab] = useState<"send" | "receive">("send")

  const handleCopy = () => {
    navigator.clipboard.writeText("0x0000000000000000000000000000000000000000")
    toast.success("Address copied to clipboard")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass p-4 sm:p-6 rounded-xl"
    >
      <div className="flex gap-2 mb-6 p-1 rounded-lg bg-background/50">
        <button
          onClick={() => setTab("send")}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            tab === "send"
              ? "bg-primary text-background shadow-lg"
              : "text-text-muted hover:text-foreground hover:bg-background/30"
          }`}
        >
          <Send className="w-4 h-4 inline mr-2" />
          Send
        </button>
        <button
          onClick={() => setTab("receive")}
          className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
            tab === "receive"
              ? "bg-primary text-background shadow-lg"
              : "text-text-muted hover:text-foreground hover:bg-background/30"
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 inline mr-2" />
          Receive
        </button>
      </div>

      {tab === "send" ? (
        <div className="space-y-4">
          <div className="p-6 rounded-xl border border-primary/20 bg-primary/5">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-bold text-lg mb-2">Coming Soon</h4>
              <p className="text-sm text-text-muted">
                Send feature is currently under development
              </p>
              <p className="text-xs text-text-muted mt-1">
                This feature will be available soon
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-6 rounded-xl border border-success/20 bg-success/5">
            <div className="text-center mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
                <ArrowDownLeft className="w-8 h-8 text-success" />
              </div>
              <h4 className="font-bold text-lg mb-2">Receive Tokens</h4>
              <p className="text-sm text-text-muted">
                Share your wallet address to receive tokens
              </p>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-text-muted mb-2 block">
              Your Wallet Address
            </label>
            <div className="relative">
              <div className="rounded-lg p-3 pr-12 font-mono text-xs sm:text-sm text-text-muted break-all border border-input bg-background/50">
                0x0000000000000000000000000000000000000000
              </div>
              <button
                onClick={handleCopy}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-background/50 transition-colors"
                title="Copy address"
              >
                <Copy className="w-4 h-4 text-text-muted hover:text-foreground" />
              </button>
            </div>
            <p className="text-xs text-text-muted mt-2">
              Wallet address will be available when send/receive feature is activated
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}
