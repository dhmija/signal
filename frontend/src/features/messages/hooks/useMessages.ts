import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo } from "react"
import { api } from "@/services/api"
import { useAuthStore } from "@/store/auth"
import { useSocketStore } from "@/store/socket"
import type { Attachment, Message } from "@/types"

export function useMessages(conversationId: number) {
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  const subscribeMessageReceived = useSocketStore((state) => state.subscribeMessageReceived)
  const subscribeStatusUpdated = useSocketStore((state) => state.subscribeStatusUpdated)
  const subscribeReactionUpdated = useSocketStore((state) => state.subscribeReactionUpdated)

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
    mutationFn: (payload: { body: string; reply_to_id?: number | null; attachments?: Partial<Attachment>[] }) =>
      api.post<Message>(
        "/messages",
        {
          conversation_id: conversationId,
          body: payload.body,
          reply_to_id: payload.reply_to_id,
          attachments: payload.attachments,
        },
        token ?? undefined
      ),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey })
      const previousMessages = queryClient.getQueryData<Message[]>(queryKey) || []

      const tempMessage: Message = {
        id: Date.now(),
        conversation_id: conversationId,
        sender_id: user?.id || 0,
        body: payload.body,
        status: "sending",
        created_at: new Date().toISOString(),
        reply_to_id: payload.reply_to_id || null,
        disappears_at: null,
        edited_at: null,
        reactions: [],
        attachments: (payload.attachments as Attachment[]) || [],
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

  const toggleReactionMutation = useMutation({
    mutationFn: (payload: { messageId: number; emoji: string }) =>
      api.post<Message>(
        `/messages/${payload.messageId}/reactions`,
        { emoji: payload.emoji },
        token ?? undefined
      ),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey })
      const previousMessages = queryClient.getQueryData<Message[]>(queryKey) || []

      // Optimistically update reactions
      queryClient.setQueryData<Message[]>(queryKey, (old = []) =>
        old.map((m) => {
          if (m.id !== payload.messageId) return m

          const currentReactions = m.reactions || []
          const existingSameEmojiIdx = currentReactions.findIndex(
            (r) => r.user_id === user?.id && r.emoji === payload.emoji
          )

          const updatedReactions = currentReactions.filter((r) => r.user_id !== user?.id)

          if (existingSameEmojiIdx < 0) {
            updatedReactions.push({
              id: Date.now(),
              message_id: payload.messageId,
              user_id: user?.id || 0,
              emoji: payload.emoji,
              created_at: new Date().toISOString(),
            })
          }

          return { ...m, reactions: updatedReactions }
        })
      )

      return { previousMessages }
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(queryKey, context.previousMessages)
      }
    },
  })

  useEffect(() => {
    const unsubMsg = subscribeMessageReceived((newMsg: Message) => {
      if (newMsg.conversation_id === conversationId) {
        queryClient.setQueryData<Message[]>(queryKey, (old = []) => {
          if (old.some((m) => m.id === newMsg.id)) return old
          return [...old, newMsg]
        })
      }
      queryClient.invalidateQueries({ queryKey: ["conversations"] })
    })

    const unsubStatus = subscribeStatusUpdated((payload) => {
      if (payload.conversation_id === conversationId) {
        queryClient.setQueryData<Message[]>(queryKey, (old = []) =>
          old.map((m) =>
            payload.message_ids.includes(m.id) ? { ...m, status: payload.status as Message["status"] } : m
          )
        )
      }
    })

    const unsubReaction = subscribeReactionUpdated((payload) => {
      if (payload.conversation_id === conversationId) {
        queryClient.setQueryData<Message[]>(queryKey, (old = []) =>
          old.map((m) => (m.id === payload.message_id ? payload.updated_message : m))
        )
      }
    })

    return () => {
      unsubMsg()
      unsubStatus()
      unsubReaction()
    }
  }, [conversationId, queryClient, queryKey, subscribeMessageReceived, subscribeStatusUpdated, subscribeReactionUpdated])

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
    toggleReaction: toggleReactionMutation.mutate,
  }
}
