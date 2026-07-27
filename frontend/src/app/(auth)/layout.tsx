"use client"

import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

import { SignalLogo } from "@/components/SignalLogo"
import { useAuthStore } from "@/store/auth"

export default function AuthLayout({ children }: { children: ReactNode }) {
  const token = useAuthStore((state) => state.token)
  const router = useRouter()

  useEffect(() => {
    if (token) {
      router.replace("/conversations")
    }
  }, [token, router])

  if (token) return null

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12 select-none">
      {/* Official Signal Icon Header */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-transparent transition-transform hover:scale-105">
          <SignalLogo size={64} />
        </div>
        <span className="text-xl font-bold tracking-tight text-foreground">Signal</span>
      </div>

      {children}
    </div>
  )
}
