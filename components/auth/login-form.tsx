"use client"

import { useState, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof loginSchema>

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToSignUp?: () => void
}

export function LoginForm({ onSuccess, onSwitchToSignUp }: LoginFormProps) {
  const { signIn } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = useCallback(async (data: LoginFormData) => {
    setIsSubmitting(true)
    try {
      const { error } = await signIn(data.email, data.password)

      if (error) {
        toast.error(error.message || "Invalid email or password")
      } else {
        toast.success("Logged in successfully!")
        onSuccess?.()
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }, [signIn, onSuccess])

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-gray-200">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
          placeholder="your.email@example.com"
          disabled={isSubmitting}
          className={cn(
            "h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500",
            "focus-visible:border-[#22c55e] focus-visible:ring-[#22c55e]/30 focus-visible:ring-2",
            "transition-all hover:border-white/20"
          )}
        />
        {errors.email && (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-sm font-semibold text-gray-200">
            Password
          </Label>
          <button
            type="button"
            className="text-xs text-gray-400 hover:text-[#22c55e] transition-colors"
            tabIndex={-1}
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            {...register("password")}
            placeholder="Enter your password"
            disabled={isSubmitting}
          className={cn(
            "h-11 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500",
            "focus-visible:border-[#22c55e] focus-visible:ring-[#22c55e]/30 focus-visible:ring-2",
            "transition-all hover:border-white/20"
          )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Submit Button */}
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-[#22c55e] via-[#ef4444] to-[#3b82f6] text-white font-semibold h-12 hover:shadow-[0_8px_24px_rgba(34,197,94,0.4)] hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing In...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      {/* Switch to Sign Up */}
      {onSwitchToSignUp && (
        <div className="text-center text-sm pt-1">
          <span className="text-gray-400">Don't have an account? </span>
          <button
            type="button"
            onClick={onSwitchToSignUp}
            className="text-transparent bg-clip-text bg-gradient-to-r from-[#22c55e] via-[#ef4444] to-[#3b82f6] font-semibold hover:underline transition-all"
          >
            Sign Up
          </button>
        </div>
      )}
    </form>
  )
}
