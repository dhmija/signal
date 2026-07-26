import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { api } from "@/services/api"
import { useAuthStore } from "@/store/auth"
import type { Conversation, User } from "@/types"

export interface GroupMember {
  id: number
  conversation_id: number
  user_id: number
  role: "member" | "admin"
  joined_at: string
  user: User
}

export function useGroupManagement(conversationId?: number) {
  const token = useAuthStore((state) => state.token)
  const queryClient = useQueryClient()

  // Fetch group members
  const membersQuery = useQuery<GroupMember[]>({
    queryKey: ["conversations", conversationId, "members"],
    queryFn: () =>
      api.get<GroupMember[]>(
        `/conversations/${conversationId}/members`,
        token ?? undefined
      ),
    enabled: !!token && !!conversationId,
  })

  // Create group conversation mutation
  const createGroupMutation = useMutation({
    mutationFn: (data: { name: string; participant_ids: number[]; avatar_url?: string }) =>
      api.post<Conversation>(
        "/conversations",
        {
          type: "group",
          name: data.name,
          participant_ids: data.participant_ids,
          avatar_url: data.avatar_url,
        },
        token ?? undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    },
  })

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: (userId: number) =>
      api.post<GroupMember>(
        `/conversations/${conversationId}/members`,
        { user_id: userId, role: "member" },
        token ?? undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", conversationId, "members"] })
      queryClient.invalidateQueries({ queryKey: ["conversations", conversationId] })
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    },
  })

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: (userId: number) =>
      api.delete(
        `/conversations/${conversationId}/members/${userId}`,
        token ?? undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations", conversationId, "members"] })
      queryClient.invalidateQueries({ queryKey: ["conversations", conversationId] })
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    },
  })

  // Delete conversation mutation
  const deleteGroupMutation = useMutation({
    mutationFn: () =>
      api.delete(
        `/conversations/${conversationId}`,
        token ?? undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    },
  })

  return {
    members: membersQuery.data || [],
    isLoadingMembers: membersQuery.isLoading,
    createGroup: createGroupMutation.mutateAsync,
    isCreating: createGroupMutation.isPending,
    addMember: addMemberMutation.mutateAsync,
    isAdding: addMemberMutation.isPending,
    removeMember: removeMemberMutation.mutateAsync,
    isRemoving: removeMemberMutation.isPending,
    deleteGroup: deleteGroupMutation.mutateAsync,
    isDeleting: deleteGroupMutation.isPending,
  }
}
