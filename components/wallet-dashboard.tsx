"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { PortfolioCard } from "./portfolio-card"
import { AssetList } from "./asset-list"
import { PortfolioChart } from "./portfolio-chart"
import { TransactionsList } from "./transactions-list"
import { TransactionUI } from "./transaction-ui"
import { GradientBackground } from "./gradient-background"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
import { ReferralSection } from "./referral/referral-section"
import { TasksSection } from "./tasks/tasks-section"
import { AirdropSection } from "./airdrop/airdrop-section"
import { WithdrawSection } from "./withdraw/withdraw-section"
import { useAuth } from "@/contexts/auth-context"
import { Users, Trophy, Gift, ArrowUpRight, Wallet, LogOut, Loader2 } from "lucide-react"
import { Button } from "./ui/button"
import { toast } from "sonner"

export function WalletDashboard() {
  const { profile, signOut } = useAuth()
  const [activeTab, setActiveTab] = useState("wallet")
  const [isMobile, setIsMobile] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Detect mobile viewport size and update on resize
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.innerWidth <= 768)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => {
      window.removeEventListener("resize", checkMobile)
    }
  }, [])


  const handleSignOut = async () => {
    // Prevent multiple simultaneous sign out attempts
    if (isSigningOut) {
      return
    }

    // Confirm before signing out (with fallback)
    try {
      const confirmed = window.confirm("Are you sure you want to exit? You will be signed out.")
      if (!confirmed) {
        return
      }
    } catch (error) {
      // If confirm fails (e.g., in some browsers), proceed anyway
      console.warn("Confirm dialog failed, proceeding with sign out:", error)
    }

    try {
      setIsSigningOut(true)
      
      // Set timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("Sign out timeout - taking too long"))
        }, 10000) // 10 second timeout
      })

      // Race between signOut and timeout
      await Promise.race([
        signOut(),
        timeoutPromise
      ])

      toast.success("Signed out successfully")
      
      // Clear any cached data
      if (typeof window !== "undefined") {
        localStorage.removeItem('referral_code')
      }
      
      // Force page reload as fallback if redirect doesn't work
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.location.href = "/"
        }
      }, 500)
    } catch (error: any) {
      console.error("Error signing out:", error)
      
      // Reset state even on error
      setIsSigningOut(false)
      
      // Show appropriate error message
      if (error?.message?.includes("timeout")) {
        toast.error("Sign out is taking too long. Please refresh the page.")
        // Force reload as last resort
        setTimeout(() => {
          if (typeof window !== "undefined") {
            window.location.href = "/"
          }
        }, 2000)
      } else {
        toast.error("Failed to sign out. Please try again.")
      }
    }
  }

  return (
    <div className={`relative min-h-screen bg-background ${isMobile ? "pb-4" : "pb-8"}`}>
      <GradientBackground />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-4 sm:py-6 md:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8 md:mb-12"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold gradient-text mb-1 sm:mb-2">Zentra Wallet</h1>
            <p className="text-sm sm:text-base text-text-muted">
              Welcome back, {profile?.nickname || "User"}!
            </p>
          </div>
          <button 
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-white/10 border border-transparent hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Sign out"
            title="Exit / Sign out"
          >
            {isSigningOut ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
            <span className="hidden sm:inline text-sm">
              {isSigningOut ? "Signing out..." : "Exit"}
            </span>
          </button>
        </motion.div>

        {/* Portfolio Overview */}
        <PortfolioCard />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 sm:mt-6 md:mt-8">
          <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <TabsList className="mb-4 sm:mb-6 w-full sm:w-auto inline-flex">
              <TabsTrigger value="wallet" className="text-xs sm:text-sm">
                <Wallet className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Wallet</span>
              </TabsTrigger>
              <TabsTrigger value="referral" className="text-xs sm:text-sm">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Referral</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs sm:text-sm">
                <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="airdrop" className="text-xs sm:text-sm">
                <Gift className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Airdrop</span>
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="text-xs sm:text-sm">
                <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Withdraw</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Keep all tabs mounted but hidden - prevents reloading on tab switch */}
          <TabsContent value="wallet">
            <div className="space-y-6">
              {/* Assets Section - Moved to top */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                  <AssetList />
                </div>
                <div className="lg:col-span-2">
                  <TransactionUI />
                </div>
              </div>

              {/* Portfolio Performance and Transactions */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  <PortfolioChart />
                  <TransactionsList />
                </div>

                {/* Right Column - Empty for now, can add more widgets later */}
                <div className="hidden lg:block"></div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="referral">
            <ReferralSection />
          </TabsContent>

          <TabsContent value="tasks">
            <TasksSection />
          </TabsContent>

          <TabsContent value="airdrop">
            <AirdropSection />
          </TabsContent>

          <TabsContent value="withdraw">
            <WithdrawSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
