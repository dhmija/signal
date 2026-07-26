"use client"

import { use } from "react"
import { useAuthStore } from "@/store/auth"
import { useConversation } from "@/features/conversations/hooks/useConversation"
import { ConversationHeader } from "@/features/conversations/components/ConversationHeader"
import { useMessages } from "@/features/messages/hooks/useMessages"
import { MessageInput } from "@/features/messages/components/MessageInput"
import { MessageList } from "@/features/messages/components/MessageList"

interface ConversationPageProps {
  params: Promise<{ id: string }>
}

export default function ConversationDetailPage({ params }: ConversationPageProps) {
  const resolvedParams = use(params)
  const conversationId = Number(resolvedParams.id)
  const currentUser = useAuthStore((state) => state.user)

  const { data: conversation, isLoading: isConvLoading, isError: isConvError } = useConversation(conversationId)
  const { messages, isLoading: isMsgsLoading, sendMessage, isSending } = useMessages(conversationId)

  if (isConvLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
        Loading chat...
      </div>
    )
  }

  if (isConvError || !conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-destructive">
        Failed to load conversation.
      </div>
    )
  }

  // Find recipient ID for 1:1 typing indicators
  const recipient = conversation.participants.find((p) => p.id !== currentUser?.id)
  const recipientId = recipient ? recipient.id : null

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <ConversationHeader conversation={conversation} />
      <MessageList
        conversationId={conversationId}
        conversation={conversation}
        messages={messages}
        isLoading={isMsgsLoading}
      />
      <MessageInput
        conversationId={conversationId}
        recipientId={recipientId}
        onSend={sendMessage}
        disabled={isSending}
      />
    </div>
  )
}
