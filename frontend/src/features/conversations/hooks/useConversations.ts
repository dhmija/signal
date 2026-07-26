import { useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"
import { useAuthStore } from "@/store/auth"
import type { Conversation } from "@/types"

export function useConversations() {
  const token = useAuthStore((state) => state.token)

  return useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () => api.get<Conversation[]>("/conversations", token ?? undefined),
    enabled: !!token,
    refetchInterval: 10_000, // Poll every 10s until WebSockets in Phase 3
  })
}
