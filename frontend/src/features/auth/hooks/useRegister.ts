import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"

import { api, ApiError } from "@/services/api"
import { useAuthStore } from "@/store/auth"
import type { TokenResponse } from "@/types"
import type { RegisterFormValues } from "../schemas"

export function useRegister() {
  const { setToken } = useAuthStore()
  const router = useRouter()

  const mutation = useMutation({
    mutationFn: (values: RegisterFormValues) =>
      api.post<TokenResponse>("/auth/register", {
        username: values.username,
        password: values.password,
        otp: values.otp,
        display_name: values.display_name,
        avatar_url: values.avatar_url || undefined,
      }),
    onSuccess: ({ access_token }) => {
      setToken(access_token)
      router.push("/conversations")
    },
  })

  return {
    register: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error instanceof ApiError ? mutation.error.message : null,
  }
}
