import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { api } from "@/services/api"
import { useAuthStore } from "@/store/auth"
import { useSocketStore } from "@/store/socket"
import type { Message } from "@/types"

export function useMessages(conversationId: number) {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  const setOnMessageReceived = useSocketStore((state) => state.setOnMessageReceived)
  const setOnStatusUpdated = useSocketStore((state) => state.setOnStatusUpdated)

  const queryKey = useMemo(() => ["messages", conversationId], [conversationId])

  const query = useQuery<Message[]>({
    queryKey,
    queryFn: () =>
      api.get<Message[]>(`/messages?conversation_id=${conversationId}`, token ?? undefined),
    enabled: !!token && !!conversationId,
  })

  const markReadMutation = useMutation({
    mutationFn: () =>
      api.post("/messages/read", { conversation_id: conversationId }, token ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    },
  })

  const mutateMarkRead = markReadMutation.mutate

  const sendMessageMutation = useMutation({
    mutationFn: (body: string) =>
      api.post<Message>(
        "/messages",
        { conversation_id: conversationId, body },
        token ?? undefined
      ),
    onMutate: async (body: string) => {
      await queryClient.cancelQueries({ queryKey })
      const previousMessages = queryClient.getQueryData<Message[]>(queryKey) || []

      const tempMessage: Message = {
        id: Date.now(),
        conversation_id: conversationId,
        sender_id: user?.id || 0,
        body,
        status: "sending",
        created_at: new Date().toISOString(),
        reply_to_id: null,
        disappears_at: null,
        edited_at: null,
        reactions: [],
        attachments: [],
      }

      queryClient.setQueryData<Message[]>(queryKey, [...previousMessages, tempMessage])
      return { previousMessages }
    },
    onError: (_err, _newMsg, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKey, context.previousMessages)
      }
    },
    onSuccess: (serverMessage) => {
      queryClient.setQueryData<Message[]>(queryKey, (old = []) =>
        old.map((m) => (m.status === "sending" && m.body === serverMessage.body ? serverMessage : m))
      )
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    },
  })

  useEffect(() => {
    setOnMessageReceived((newMsg: Message) => {
      if (newMsg.conversation_id === conversationId) {
        queryClient.setQueryData<Message[]>(queryKey, (old = []) => {
          if (old.some((m) => m.id === newMsg.id)) return old
          return [...old, newMsg]
        })
      }
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    })

    setOnStatusUpdated((payload) => {
      if (payload.conversation_id === conversationId) {
        queryClient.setQueryData<Message[]>(queryKey, (old = []) =>
          old.map((m) =>
            payload.message_ids.includes(m.id) ? { ...m, status: payload.status as Message["status"] } : m
          )
        )
      }
    })
  }, [conversationId, queryClient, queryKey, setOnMessageReceived, setOnStatusUpdated])

  const messageCount = query.data?.length || 0
  useEffect(() => {
    if (token && conversationId && messageCount > 0) {
      mutateMarkRead()
    }
  }, [token, conversationId, messageCount, mutateMarkRead])

  return {
    messages: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,
  }
}
