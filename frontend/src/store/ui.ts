import { create } from "zustand"
import { persist } from "zustand/middleware"

type Theme = "dark" | "light" | "system"

interface UIState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: "dark",
      setTheme: (theme) => set({ theme }),
    }),
    { name: "signal-ui" },
  ),
)
