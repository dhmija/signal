"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { CheckCircle2, ChevronLeft, Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import { MOCK_OTP_HINT, API_BASE } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "../schemas"

const STEPS = ["Account", "Verify", "Reset"] as const
type Step = 0 | 1 | 2

export function ForgotPasswordForm() {
  const [step, setStep] = useState<Step>(0)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [isCheckingUser, setIsCheckingUser] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange",
    defaultValues: { username: "", otp: "", newPassword: "", confirmNewPassword: "" },
  })

  const username = useWatch({ control, name: "username" })
  const newPassword = useWatch({ control, name: "newPassword" })
  const confirmNewPassword = useWatch({ control, name: "confirmNewPassword" })

  const isPasswordMismatch = Boolean(confirmNewPassword && newPassword !== confirmNewPassword)

  const advance = async () => {
    if (step === 0) {
      clearErrors("username")
      const validStep0 = await trigger(["username"])
      if (!validStep0) return

      setIsCheckingUser(true)
      try {
        const res = await fetch(`${API_BASE}/auth/check-username?username=${encodeURIComponent(username.trim())}`)
        if (res.ok) {
          const data = await res.json()
          if (!data.exists) {
            setError("username", { type: "manual", message: "User not found." })
            setIsCheckingUser(false)
            return
          }
        }
      } catch (err) {
        console.error("User check failed:", err)
      } finally {
        setIsCheckingUser(false)
      }

      setStep(1)
      return
    }

    if (step === 1) {
      const validStep1 = await trigger(["otp"])
      if (!validStep1) return
      setStep(2)
      return
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    setIsSubmitting(true)
    setResetError(null)

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: values.username.trim(),
          otp: values.otp,
          new_password: values.newPassword,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ detail: "Failed to reset password" }))
        throw new Error(data.detail || "Failed to reset password")
      }

      setIsSuccess(true)
    } catch (err) {
      setResetError(err instanceof Error ? err.message : "Failed to reset password.")
    } finally {
      setIsSubmitting(false)
    }
  })

  const handleKeyDownStep = (e: React.KeyboardEvent, nextAction: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault()
      nextAction()
    }
  }

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm text-center space-y-5"
      >
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20 text-primary">
            <CheckCircle2 className="h-10 w-10" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Password Reset Complete</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your password has been successfully updated. You can now sign in using your new credentials.
          </p>
        </div>

        <Link
          href="/login"
          className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover active:scale-[0.99]"
        >
          Back to Sign In
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      <div className="mb-6 text-center">
        <div className="mb-5 flex items-center justify-center gap-3 select-none">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all",
                  i < step
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : i === step
                      ? "bg-primary text-primary-foreground ring-2 ring-ring ring-offset-2 ring-offset-background font-bold"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-10 transition-colors rounded-full",
                    i < step ? "bg-primary" : "bg-border/60",
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {step === 0 && "Reset your password"}
          {step === 1 && "Verify code"}
          {step === 2 && "New password"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {step === 0 && "Enter your username to begin recovery"}
          {step === 1 && "Enter the verification code sent to your device"}
          {step === 2 && "Choose a strong new password"}
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
              onKeyDown={(e) => handleKeyDownStep(e, advance)}
            >
              <div className="space-y-1.5">
                <label htmlFor="reset-username" className="text-xs font-semibold text-foreground">
                  Username
                </label>
                <input
                  id="reset-username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder="your.username"
                  className={cn(
                    "w-full rounded-lg border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60",
                    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                    errors.username && "border-destructive focus:ring-destructive",
                  )}
                  {...register("username", {
                    onChange: () => clearErrors("username"),
                  })}
                />
                {errors.username && (
                  <p className="text-xs text-destructive font-medium">{errors.username.message}</p>
                )}
              </div>

              <button
                type="button"
                onClick={advance}
                disabled={isCheckingUser}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-60 cursor-pointer"
              >
                {isCheckingUser && <Loader2 size={16} className="animate-spin" />}
                {isCheckingUser ? "Finding account..." : "Continue"}
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
              onKeyDown={(e) => handleKeyDownStep(e, advance)}
            >
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-3.5 text-card-foreground space-y-2 select-none shadow-xs">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider">
                  <ShieldCheck className="h-4 w-4" />
                  <span>Demo Mode</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  SMS verification is simulated for this evaluation environment. Use the demo verification code below to proceed:
                </p>
                <div className="flex items-center justify-center rounded-lg bg-card border border-border/60 py-2 font-mono text-lg font-bold tracking-[0.3em] text-primary">
                  {MOCK_OTP_HINT}
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                <label htmlFor="reset-otp" className="text-xs font-semibold text-foreground">
                  Verification Code
                </label>
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  placeholder="123456"
                  className={cn(
                    "w-full rounded-lg border bg-input px-3.5 py-2.5 text-center text-xl font-mono tracking-[0.5em] text-foreground placeholder:tracking-normal placeholder:text-muted-foreground/40",
                    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                    errors.otp && "border-destructive focus:ring-destructive",
                  )}
                  {...register("otp")}
                />
                {errors.otp && (
                  <p className="text-xs text-destructive font-medium">{errors.otp.message}</p>
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex items-center gap-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={advance}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover active:scale-[0.99] cursor-pointer"
                >
                  Verify Code
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label htmlFor="reset-new-password" className="text-xs font-semibold text-foreground">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="reset-new-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    autoFocus
                    placeholder="••••••••"
                    className={cn(
                      "w-full rounded-lg border bg-input px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60",
                      "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                      errors.newPassword && "border-destructive focus:ring-destructive",
                    )}
                    {...register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-xs text-destructive font-medium">{errors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reset-confirm-password" className="text-xs font-semibold text-foreground">
                  Confirm New Password
                </label>
                <input
                  id="reset-confirm-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={cn(
                    "w-full rounded-lg border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60",
                    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                    (errors.confirmNewPassword || isPasswordMismatch) && "border-destructive focus:ring-destructive",
                  )}
                  {...register("confirmNewPassword")}
                />
                {(errors.confirmNewPassword?.message || isPasswordMismatch) && (
                  <p className="text-xs text-destructive font-medium">
                    {errors.confirmNewPassword?.message || "Passwords do not match."}
                  </p>
                )}
              </div>

              {resetError && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive font-medium"
                >
                  {resetError}
                </motion.div>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isPasswordMismatch}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm",
                    "transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none cursor-pointer",
                  )}
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </motion.div>
  )
}
