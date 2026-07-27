"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Eye, EyeOff, Info, Loader2, ShieldCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"

import { MOCK_OTP_HINT } from "@/lib/constants"
import { cn, dicebearUrl } from "@/lib/utils"
import { useRegister } from "../hooks/useRegister"
import { registerSchema, type RegisterFormValues } from "../schemas"

const STEPS = ["Account", "Verify", "Profile"] as const
type Step = 0 | 1 | 2

export function RegisterForm() {
  const { register: registerUser, isPending, error } = useRegister()
  const [step, setStep] = useState<Step>(0)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    trigger,
    control,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { avatar_url: "", display_name: "" },
  })

  const username = useWatch({ control, name: "username" })
  const displayName = useWatch({ control, name: "display_name" })
  const avatarUrlInput = useWatch({ control, name: "avatar_url" })

  const advance = async () => {
    const fieldsPerStep: Array<Array<keyof RegisterFormValues>> = [
      ["username", "password", "confirmPassword"],
      ["otp"],
      ["display_name", "avatar_url"],
    ]
    const valid = await trigger(fieldsPerStep[step])
    if (valid) {
      if (step === 1 && !displayName) {
        setValue("display_name", username || "")
      }
      setStep((s) => Math.min(s + 1, 2) as Step)
    }
  }

  const onSubmit = handleSubmit((values) => registerUser(values))

  const handleKeyDownStep = (e: React.KeyboardEvent, nextAction: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault()
      nextAction()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      {/* Step indicator */}
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
          {step === 0 && "Create your account"}
          {step === 1 && "Verify phone number"}
          {step === 2 && "Set up your profile"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {step === 0 && "Choose a unique username and secure password"}
          {step === 1 && "Enter the verification code sent to your phone"}
          {step === 2 && "Choose how your profile appears to contacts"}
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
                <label htmlFor="reg-username" className="text-xs font-semibold text-foreground">
                  Username
                </label>
                <input
                  id="reg-username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder="your.username"
                  className={cn(
                    "w-full rounded-lg border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60",
                    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                    errors.username && "border-destructive focus:ring-destructive",
                  )}
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-xs text-destructive font-medium">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-password" className="text-xs font-semibold text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={cn(
                      "w-full rounded-lg border bg-input px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60",
                      "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                      errors.password && "border-destructive focus:ring-destructive",
                    )}
                    {...register("password")}
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
                {errors.password && (
                  <p className="text-xs text-destructive font-medium">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-confirm" className="text-xs font-semibold text-foreground">
                  Confirm password
                </label>
                <input
                  id="reg-confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={cn(
                    "w-full rounded-lg border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60",
                    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                    errors.confirmPassword && "border-destructive focus:ring-destructive",
                  )}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive font-medium">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="button"
                onClick={advance}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover active:scale-[0.99] cursor-pointer"
              >
                Continue
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
              {/* Highlighted Demo Notice */}
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
                <label htmlFor="reg-otp" className="text-xs font-semibold text-foreground">
                  Verification Code
                </label>
                <input
                  id="reg-otp"
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
              {/* Avatar preview */}
              <div className="flex flex-col items-center justify-center gap-2 py-1">
                <div className="relative overflow-hidden rounded-full border-2 border-primary/40 p-0.5 bg-card shadow-sm">
                  <Image
                    src={avatarUrlInput || dicebearUrl(username || "user")}
                    alt="Profile avatar preview"
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-full object-cover"
                    unoptimized
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">Profile Avatar Preview</span>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-display-name" className="text-xs font-semibold text-foreground">
                  Display Name
                </label>
                <input
                  id="reg-display-name"
                  type="text"
                  autoFocus
                  placeholder="e.g. Alex Rivera"
                  className={cn(
                    "w-full rounded-lg border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60",
                    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                    errors.display_name && "border-destructive focus:ring-destructive",
                  )}
                  {...register("display_name")}
                />
                {errors.display_name && (
                  <p className="text-xs text-destructive font-medium">{errors.display_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-avatar" className="text-xs font-semibold text-foreground">
                  Avatar URL{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="reg-avatar"
                  type="url"
                  placeholder="https://example.com/avatar.png"
                  className={cn(
                    "w-full rounded-lg border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60",
                    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
                    errors.avatar_url && "border-destructive focus:ring-destructive",
                  )}
                  {...register("avatar_url")}
                />
                {errors.avatar_url && (
                  <p className="text-xs text-destructive font-medium">{errors.avatar_url.message}</p>
                )}
                <div className="flex items-start gap-1.5 text-[11px] text-muted-foreground pt-0.5">
                  <Info size={13} className="shrink-0 mt-0.5 text-primary/70" />
                  <span>Leave empty to auto-generate a unique avatar based on your username.</span>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive font-medium"
                >
                  {error}
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
                  disabled={isPending}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm",
                    "transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none cursor-pointer",
                  )}
                >
                  {isPending && <Loader2 size={16} className="animate-spin" />}
                  {isPending ? "Creating Account..." : "Create Account"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
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
