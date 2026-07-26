"use client"

import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

import { useAuthStore } from "@/store/auth"

// App layout guards the entire (app) route group.
// If no token exists, redirect to login immediately without flashing the UI.
export default function AppLayout({ children }: { children: ReactNode }) {
  const { token } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!token) {
      router.replace("/login")
    }
  }, [token, router])

  if (!token) return null

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {children}
    </div>
  )
}
