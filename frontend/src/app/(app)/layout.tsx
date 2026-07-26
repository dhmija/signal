"use client"

import { useRouter } from "next/navigation"
import { useEffect, type ReactNode } from "react"

import { useAuthStore } from "@/store/auth"
import { Sidebar } from "@/features/conversations/components/Sidebar"

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
      <Sidebar />
      <main className="flex flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  )
}
