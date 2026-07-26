import { useQuery } from "@tanstack/react-query"
import { api } from "@/services/api"
import { useAuthStore } from "@/store/auth"
import type { Conversation } from "@/types"

export function useConversation(id: number | null) {
  const token = useAuthStore((state) => state.token)

  return useQuery<Conversation>({
    queryKey: ["conversations", id],
    queryFn: () => api.get<Conversation>(`/conversations/${id}`, token ?? undefined),
    enabled: !!token && id !== null,
  })
}
