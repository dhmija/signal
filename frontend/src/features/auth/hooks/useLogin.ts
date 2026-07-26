import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { api, ApiError } from "@/services/api"
import { useAuthStore } from "@/store/auth"
import type { TokenResponse } from "@/types"
import type { LoginFormValues } from "../schemas"

export function useLogin() {
  const { setToken } = useAuthStore()
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: (values: LoginFormValues) =>
      api.post<TokenResponse>("/auth/login", values),
    onSuccess: ({ access_token }) => {
      setToken(access_token)
      router.push("/conversations")
    },
  })

  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error instanceof ApiError ? mutation.error.message : null,
  }
}
