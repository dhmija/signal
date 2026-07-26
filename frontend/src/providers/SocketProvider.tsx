"use client"

import { useEffect, type ReactNode } from "react"
import { useAuthStore } from "@/store/auth"
import { useSocketStore } from "@/store/socket"

export function SocketProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const { connect, disconnect } = useSocketStore()

  useEffect(() => {
    if (user?.id) {
      connect(user.id)
    } else {
      disconnect()
    }

    return () => {
      disconnect()
    }
  }, [user?.id, connect, disconnect])

  return <>{children}</>
}
