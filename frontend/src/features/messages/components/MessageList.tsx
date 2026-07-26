"use client"

import { useEffect, useRef } from "react"
import { useAuthStore } from "@/store/auth"
import { useSocketStore } from "@/store/socket"
import type { Message } from "@/types"
import { MessageBubble } from "./MessageBubble"
import { TypingIndicator } from "./TypingIndicator"

interface MessageListProps {
  conversationId: number
  messages: Message[]
  isLoading: boolean
}

export function MessageList({ conversationId, messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentUser = useAuthStore((state) => state.user)

  // Track active typing users for this conversation
  const typingUsers = useSocketStore((state) => state.typingUsers[conversationId])
  const isTyping = typingUsers && typingUsers.size > 0

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length, isTyping])

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-4 text-xs text-muted-foreground">
        Loading messages...
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="flex flex-1 flex-col overflow-y-auto p-4 space-y-1 bg-background"
    >
      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-xs text-muted-foreground select-none">
          No messages yet. Send a message to start chatting!
        </div>
      ) : (
        messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.sender_id === currentUser?.id}
          />
        ))
      )}

      {isTyping && <TypingIndicator />}
    </div>
  )
}
