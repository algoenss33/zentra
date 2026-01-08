"use client"

import { motion } from "framer-motion"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { useBalance } from "@/hooks/use-balance"
import { useTransactions } from "@/hooks/use-transactions"
import { useMemo } from "react"

export function PortfolioChart() {
  const { getTotalPortfolioValue } = useBalance()
  const { transactions } = useTransactions()
  
  // Create chart data from transactions history
  const chartData = useMemo(() => {
    const currentValue = getTotalPortfolioValue()
    
    // Group transactions by date and calculate cumulative value
    const sortedTransactions = [...transactions]
      .filter(tx => tx.status === 'confirmed')
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    
    if (sortedTransactions.length === 0) {
      // If no transactions, show current value
      return [
        { date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), value: currentValue }
      ]
    }

    // Create data points from transaction history
    let cumulativeValue = 0
    const dataPoints = sortedTransactions.map(tx => {
      cumulativeValue += tx.usd_value
      return {
        date: new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: cumulativeValue
      }
    })

    // Add current value as last point
    if (dataPoints.length > 0) {
      dataPoints.push({
        date: 'Now',
        value: currentValue
      })
    }

    return dataPoints.length > 0 ? dataPoints : [{ date: 'Now', value: currentValue }]
  }, [transactions, getTotalPortfolioValue])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass p-4 sm:p-6 rounded-xl"
    >
      <h3 className="text-lg sm:text-xl font-bold mb-4">Portfolio Performance</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
          <XAxis dataKey="date" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{ backgroundColor: "#1a1f3a", border: "1px solid #00f0ff" }}
            labelStyle={{ color: "#e5e7eb" }}
            formatter={(value: number) => `$${value.toFixed(2)}`}
          />
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke="#00f0ff" 
            dot={false} 
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
