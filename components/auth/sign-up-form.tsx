"use client"

import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, RefreshCw, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

const signUpSchema = z.object({
  nickname: z.string().min(3, "Nickname must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  referralCode: z.string().optional(),
  captcha: z.string().min(1, "Captcha is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type SignUpFormData = z.infer<typeof signUpSchema>

interface SignUpFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

export function SignUpForm({ onSuccess, onSwitchToLogin }: SignUpFormProps) {
  const { signUp } = useAuth()
  const [captchaNum1, setCaptchaNum1] = useState<number>(0)
  const [captchaNum2, setCaptchaNum2] = useState<number>(0)
  const [captchaAnswer, setCaptchaAnswer] = useState<number>(0)
  const [captchaValue, setCaptchaValue] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  })

  const generateCaptcha = useCallback(() => {
    const num1 = Math.floor(Math.random() * 10) + 1
    const num2 = Math.floor(Math.random() * 10) + 1
    setCaptchaNum1(num1)
    setCaptchaNum2(num2)
    setCaptchaAnswer(num1 + num2)
    setCaptchaValue("")
  }, [])

  useEffect(() => {
    generateCaptcha()
    const savedRefCode = localStorage.getItem('referral_code')
    if (savedRefCode) {
      setValue('referralCode', savedRefCode)
    }
  }, [generateCaptcha, setValue])

  const onSubmit = async (data: SignUpFormData) => {
    if (parseInt(data.captcha) !== captchaAnswer) {
      toast.error("Invalid captcha. Please try again.")
      generateCaptcha()
      return
    }

    setIsSubmitting(true)
    try {
      const { error } = await signUp(
        data.email,
        data.password,
        data.nickname,
        data.referralCode || undefined
      )

      if (error) {
        toast.error(error.message || "Failed to sign up")
      } else {
        toast.success("Account created successfully! You are now logged in.")
        onSuccess?.()
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
      {/* Nickname */}
      <div className="space-y-2">
        <Label htmlFor="nickname" className="text-sm font-semibold text-gray-200">
          Nickname
        </Label>
        <Input
          id="nickname"
          {...register("nickname")}
          placeholder="Choose a nickname"
          disabled={isSubmitting}
          className={cn(
            "h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500",
            "focus-visible:border-[#22c55e] focus-visible:ring-[#22c55e]/30 focus-visible:ring-2",
            "transition-all hover:border-white/20"
          )}
        />
        {errors.nickname && (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
            {errors.nickname.message}
          </p>
        )}
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-semibold text-gray-200">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
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
        <Label htmlFor="password" className="text-sm font-semibold text-gray-200">
          Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            {...register("password")}
            placeholder="At least 8 characters"
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

      {/* Confirm Password */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-200">
          Confirm Password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            {...register("confirmPassword")}
            placeholder="Re-enter your password"
            disabled={isSubmitting}
            className={cn(
              "h-11 pr-10 bg-white/5 border-white/10 text-white placeholder:text-gray-500",
              "focus-visible:border-[#22c55e] focus-visible:ring-[#22c55e]/30 focus-visible:ring-2",
              "transition-all hover:border-white/20"
            )}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            tabIndex={-1}
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Referral Code */}
      <div className="space-y-2">
        <Label htmlFor="referralCode" className="text-sm font-semibold text-gray-200">
          Referral Code <span className="text-gray-500 font-normal text-xs">(Optional)</span>
        </Label>
        <Input
          id="referralCode"
          {...register("referralCode")}
          placeholder="Enter referral code if you have one"
          disabled={isSubmitting}
          className={cn(
            "h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500",
            "focus-visible:border-[#22c55e] focus-visible:ring-[#22c55e]/30 focus-visible:ring-2",
            "transition-all hover:border-white/20"
          )}
        />
      </div>

      {/* Captcha */}
      <div className="space-y-2">
        <Label htmlFor="captcha" className="text-sm font-semibold text-gray-200">
          Security Verification
        </Label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              id="captcha"
              type="text"
              inputMode="numeric"
              {...register("captcha")}
              placeholder="Answer"
              value={captchaValue}
              onChange={(e) => setCaptchaValue(e.target.value)}
              disabled={isSubmitting}
              className={cn(
                "h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500",
                "focus-visible:border-[#22c55e] focus-visible:ring-[#22c55e]/30 focus-visible:ring-2",
                "transition-all hover:border-white/20"
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-300">
              = {captchaNum1} + {captchaNum2}
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={generateCaptcha}
            disabled={isSubmitting}
            className="h-11 px-4 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-[#22c55e]/50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        {errors.captcha && (
          <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
            {errors.captcha.message}
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
            Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>

      {/* Switch to Login */}
      {onSwitchToLogin && (
        <div className="text-center text-sm pt-1">
          <span className="text-gray-400">Already have an account? </span>
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="text-transparent bg-clip-text bg-gradient-to-r from-[#22c55e] via-[#ef4444] to-[#3b82f6] font-semibold hover:underline transition-all"
          >
            Sign In
          </button>
        </div>
      )}
    </form>
  )
}
