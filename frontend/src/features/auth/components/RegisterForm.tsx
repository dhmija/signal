"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, Eye, EyeOff, Loader2 } from "lucide-react"
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
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { avatar_url: "" },
  })

  // useWatch avoids the React Compiler warning about watch() not being memoizable
  const username = useWatch({ control, name: "username" })

  const advance = async () => {
    const fieldsPerStep: Array<Array<keyof RegisterFormValues>> = [
      ["username", "password", "confirmPassword"],
      ["otp"],
      ["display_name", "avatar_url"],
    ]
    const valid = await trigger(fieldsPerStep[step])
    if (valid) setStep((s) => Math.min(s + 1, 2) as Step)
  }

  const onSubmit = handleSubmit((values) => registerUser(values))

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      {/* Step indicator */}
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  i < step
                    ? "bg-primary text-primary-foreground"
                    : i === step
                      ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {i < step ? "✓" : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px w-8 transition-colors",
                    i < step ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {step === 0 && "Create your account"}
          {step === 1 && "Verify your number"}
          {step === 2 && "Set up your profile"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === 0 && "Choose a username and password"}
          {step === 1 && `Enter the code sent to your device (hint: ${MOCK_OTP_HINT})`}
          {step === 2 && "How should others see you?"}
        </p>
      </div>

      <form onSubmit={onSubmit} noValidate>
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label htmlFor="reg-username" className="text-sm font-medium text-foreground">
                  Username
                </label>
                <input
                  id="reg-username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder="your.username"
                  className={cn(
                    "w-full rounded-lg border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
                    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
                    errors.username && "border-destructive focus:ring-destructive",
                  )}
                  {...register("username")}
                />
                {errors.username && (
                  <p className="text-xs text-destructive">{errors.username.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={cn(
                      "w-full rounded-lg border bg-input px-3.5 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground",
                      "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
                      errors.password && "border-destructive focus:ring-destructive",
                    )}
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-confirm" className="text-sm font-medium text-foreground">
                  Confirm password
                </label>
                <input
                  id="reg-confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className={cn(
                    "w-full rounded-lg border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
                    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
                    errors.confirmPassword && "border-destructive focus:ring-destructive",
                  )}
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                )}
              </div>

              <button
                type="button"
                onClick={advance}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Continue
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label htmlFor="reg-otp" className="text-sm font-medium text-foreground">
                  Verification code
                </label>
                <input
                  id="reg-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  autoFocus
                  placeholder="123456"
                  className={cn(
                    "w-full rounded-lg border bg-input px-3.5 py-2.5 text-center text-xl tracking-[0.5em] text-foreground placeholder:tracking-normal placeholder:text-muted-foreground",
                    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
                    errors.otp && "border-destructive focus:ring-destructive",
                  )}
                  {...register("otp")}
                />
                {errors.otp && (
                  <p className="text-xs text-destructive">{errors.otp.message}</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex items-center gap-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <button
                  type="button"
                  onClick={advance}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Verify
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Avatar preview */}
              {username && (
                <div className="flex justify-center">
                  <Image
                    src={dicebearUrl(username)}
                    alt="Generated avatar preview"
                    width={80}
                    height={80}
                    className="rounded-full border-2 border-border"
                    unoptimized
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="reg-display-name" className="text-sm font-medium text-foreground">
                  Display name
                </label>
                <input
                  id="reg-display-name"
                  type="text"
                  autoFocus
                  placeholder="Your Name"
                  className={cn(
                    "w-full rounded-lg border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
                    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
                    errors.display_name && "border-destructive focus:ring-destructive",
                  )}
                  {...register("display_name")}
                />
                {errors.display_name && (
                  <p className="text-xs text-destructive">{errors.display_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="reg-avatar" className="text-sm font-medium text-foreground">
                  Avatar URL{" "}
                  <span className="font-normal text-muted-foreground">(optional)</span>
                </label>
                <input
                  id="reg-avatar"
                  type="url"
                  placeholder="https://..."
                  className={cn(
                    "w-full rounded-lg border bg-input px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground",
                    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
                    errors.avatar_url && "border-destructive focus:ring-destructive",
                  )}
                  {...register("avatar_url")}
                />
                {errors.avatar_url && (
                  <p className="text-xs text-destructive">{errors.avatar_url.message}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Leave blank for a generated avatar based on your username.
                </p>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 rounded-lg border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className={cn(
                    "flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground",
                    "transition-opacity hover:opacity-90 disabled:opacity-60",
                  )}
                >
                  {isPending && <Loader2 size={16} className="animate-spin" />}
                  Create Account
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
