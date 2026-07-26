import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { api, ApiError } from "@/services/api"
import { useAuthStore } from "@/store/auth"
import type { TokenResponse, User } from "@/types"
import type { LoginFormValues } from "../schemas"

export function useLogin() {
  const { setToken, setUser } = useAuthStore()
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: async (values: LoginFormValues) => {
      const res = await api.post<TokenResponse>("/auth/login", values)
      let user: User | null = null
      try {
        user = await api.get<User>("/auth/me", res.access_token)
      } catch (e) {
        console.error("Failed to fetch profile during login:", e)
      }
      return { token: res.access_token, user }
    },
    onSuccess: ({ token, user }) => {
      setToken(token)
      if (user) setUser(user)
      router.push("/conversations")
    },
  })

  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error instanceof ApiError ? mutation.error.message : null,
  }
}
