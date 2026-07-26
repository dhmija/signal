"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { Avatar } from "@/components/Avatar"
import { cn, formatRelativeTime } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"
import { useSocketStore } from "@/store/socket"
import type { Conversation } from "@/types"

interface ConversationItemProps {
  conversation: Conversation
}

export function ConversationItem({ conversation }: ConversationItemProps) {
  const params = useParams()
  const currentUser = useAuthStore((state) => state.user)

  // Real-time typing status check from WebSocket store
  const typingUsers = useSocketStore((state) => state.typingUsers[conversation.id])
  const isTyping = typingUsers && Array.from(typingUsers).some((uid) => uid !== currentUser?.id)

  const activeId = params?.id ? Number(params.id) : null
  const isActive = activeId === conversation.id

  let name = conversation.name
  let avatarUrl = conversation.avatar_url
  let isOnline: boolean | undefined = undefined

  if (conversation.type === "direct") {
    const otherParticipant = conversation.participants.find(
      (p) => p.id !== currentUser?.id
    )
    if (otherParticipant) {
      name = otherParticipant.display_name
      avatarUrl = otherParticipant.avatar_url
      isOnline = otherParticipant.is_online
    }
  }

  const displayName = name || "Direct Message"
  const timestamp = conversation.last_message
    ? formatRelativeTime(conversation.last_message.created_at)
    : formatRelativeTime(conversation.updated_at)

  const preview = isTyping
    ? "Typing..."
    : conversation.last_message
      ? conversation.last_message.body
      : "No messages yet"

  return (
    <Link
      href={`/conversations/${conversation.id}`}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors select-none",
        isActive
          ? "bg-signal-active text-foreground font-medium"
          : "hover:bg-signal-hover text-foreground/90"
      )}
    >
      <Avatar
        src={avatarUrl}
        name={displayName}
        size="md"
        isOnline={conversation.type === "direct" ? isOnline : undefined}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-sm font-medium">{displayName}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{timestamp}</span>
        </div>

        <div className="flex items-center justify-between gap-1 mt-0.5">
          <p
            className={cn(
              "truncate text-xs",
              isTyping ? "text-primary font-medium italic" : "text-muted-foreground"
            )}
          >
            {preview}
          </p>
          {conversation.unread_count > 0 && !isTyping && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground shrink-0">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
