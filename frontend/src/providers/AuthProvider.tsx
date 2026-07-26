"use client"

import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

import { api } from "@/services/api"
import { useAuthStore } from "@/store/auth"
import type { User } from "@/types"

export function AuthProvider({ children }: { children: ReactNode }) {
  const { token, setUser, logout } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!token) return

    api
      .get<User>("/auth/me", token)
      .then(setUser)
      .catch(() => {
        // Token is invalid or expired — clear it and redirect to login
        logout()
        router.push("/login")
      })
    // We only want this to run on mount and when the token changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return <>{children}</>
}
