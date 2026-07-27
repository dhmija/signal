"use client"

import { useEffect, type ReactNode } from "react"
import { useAuthStore } from "@/store/auth"
import { useSocketStore } from "@/store/socket"

export function SocketProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((state) => state.user)
  const connect = useSocketStore((state) => state.connect)

  useEffect(() => {
    if (user?.id) {
      connect(user.id)
    }
  }, [user?.id, connect])

  return <>{children}</>
}
