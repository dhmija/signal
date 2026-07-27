"use client"

import { use, useState } from "react"
import { useAuthStore } from "@/store/auth"
import { useConversation } from "@/features/conversations/hooks/useConversation"
import { ConversationHeader } from "@/features/conversations/components/ConversationHeader"
import { useMessages } from "@/features/messages/hooks/useMessages"
import { MessageInput } from "@/features/messages/components/MessageInput"
import { MessageList } from "@/features/messages/components/MessageList"
import type { Message } from "@/types"

interface ConversationPageProps {
  params: Promise<{ id: string }>
}

export default function ConversationDetailPage({ params }: ConversationPageProps) {
  const resolvedParams = use(params)
  const conversationId = Number(resolvedParams.id)
  const currentUser = useAuthStore((state) => state.user)

  const [replyingTo, setReplyingTo] = useState<Message | null>(null)

  const { data: conversation, isLoading: isConvLoading, isError: isConvError } = useConversation(conversationId)
  const { messages, isLoading: isMsgsLoading, sendMessage, isSending, toggleReaction } = useMessages(conversationId)

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
        onReply={(msg) => setReplyingTo(msg)}
        onToggleReaction={(msgId, emoji) => toggleReaction({ messageId: msgId, emoji })}
      />
      <MessageInput
        conversationId={conversationId}
        recipientId={recipientId}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        onSend={sendMessage}
        disabled={isSending}
      />
    </div>
  )
}
