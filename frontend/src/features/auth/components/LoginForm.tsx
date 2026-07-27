"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { motion } from "framer-motion"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useForm } from "react-hook-form"

import { cn } from "@/lib/utils"
import { useLogin } from "../hooks/useLogin"
import { loginSchema, type LoginFormValues } from "../schemas"

export function LoginForm() {
  const { login, isPending, error } = useLogin()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="w-full max-w-sm"
    >
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Sign in to Signal
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Enter your username and password to continue
        </p>
      </div>

      <form onSubmit={handleSubmit((values) => login(values))} noValidate className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="login-username" className="text-xs font-semibold text-foreground">
            Username
          </label>
          <input
            id="login-username"
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
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-xs font-semibold text-foreground">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
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

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs text-destructive font-medium"
          >
            {error}
          </motion.div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm",
            "transition-all hover:bg-primary-hover active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-none cursor-pointer",
          )}
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          {isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </motion.div>
  )
}
