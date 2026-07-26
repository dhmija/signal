"use client"

import { use } from "react"
import { useConversation } from "@/features/conversations/hooks/useConversation"
import { ConversationHeader } from "@/features/conversations/components/ConversationHeader"

interface ConversationPageProps {
  params: Promise<{ id: string }>
}

export default function ConversationDetailPage({ params }: ConversationPageProps) {
  const resolvedParams = use(params)
  const conversationId = Number(resolvedParams.id)

  const { data: conversation, isLoading, isError } = useConversation(conversationId)

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground">
        Loading chat...
      </div>
    )
  }

  if (isError || !conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-xs text-destructive">
        Failed to load conversation.
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      <ConversationHeader conversation={conversation} />
      <div className="flex flex-1 items-center justify-center p-6 text-center text-xs text-muted-foreground select-none">
        No messages yet. Send a message to start the conversation!
      </div>
    </div>
  )
}
