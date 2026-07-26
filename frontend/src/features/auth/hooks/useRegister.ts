import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { api, ApiError } from "@/services/api"
import { useAuthStore } from "@/store/auth"
import type { TokenResponse, User } from "@/types"
import type { RegisterFormValues } from "../schemas"

export function useRegister() {
  const { setToken, setUser } = useAuthStore()
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: async (values: RegisterFormValues) => {
      const res = await api.post<TokenResponse>("/auth/register", {
        username: values.username,
        password: values.password,
        otp: values.otp,
        display_name: values.display_name,
        avatar_url: values.avatar_url || undefined,
      })
      const user = await api.get<User>("/auth/me", res.access_token)
      return { token: res.access_token, user }
    },
    onSuccess: ({ token, user }) => {
      setToken(token)
      setUser(user)
      router.push("/conversations")
    },
  })

  return {
    register: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error instanceof ApiError ? mutation.error.message : null,
  }
}
