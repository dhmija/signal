"use client"

import { useEffect, useRef } from "react"
import { useAuthStore } from "@/store/auth"
import { useSocketStore } from "@/store/socket"
import type { Conversation, Message } from "@/types"
import { MessageBubble } from "./MessageBubble"
import { TypingIndicator } from "./TypingIndicator"

interface MessageListProps {
  conversationId: number
  conversation?: Conversation
  messages: Message[]
  isLoading: boolean
}

export function MessageList({ conversationId, conversation, messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const currentUser = useAuthStore((state) => state.user)

  const typingUsers = useSocketStore((state) => state.typingUsers[conversationId])
  const isTyping = typingUsers && typingUsers.size > 0

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

  const isGroup = conversation?.type === "group"

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
        messages.map((message) => {
          const sender = conversation?.participants.find((p) => p.id === message.sender_id)
          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender_id === currentUser?.id}
              showSenderName={isGroup}
              senderName={sender?.display_name || message.sender?.display_name}
            />
          )
        })
      )}

      {isTyping && <TypingIndicator />}
    </div>
  )
}
