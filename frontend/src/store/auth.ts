import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { User } from "@/types"

interface AuthState {
  token: string | null
  user: User | null
  setToken: (token: string) => void
  setUser: (user: User) => void
  logout: () => void
}

// Token is persisted in localStorage so sessions survive page refreshes.
// For a production app you'd use httpOnly cookies — localStorage is
// acceptable here because there's no sensitive data beyond the session itself.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "signal-auth",
      partialize: (state) => ({ token: state.token }),
    },
  ),
)
