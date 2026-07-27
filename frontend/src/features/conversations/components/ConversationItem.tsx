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
        "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all select-none mx-1.5",
        isActive
          ? "bg-[#252525] text-foreground font-semibold shadow-xs"
          : "hover:bg-[#1F1F1F] text-foreground/80 hover:text-foreground"
      )}
    >
      <Avatar
        src={avatarUrl}
        name={displayName}
        size="md"
        isOnline={conversation.type === "direct" ? isOnline : undefined}
      />

      <div className="flex flex-1 flex-col overflow-hidden leading-tight">
        <div className="flex items-center justify-between gap-1">
          <span className={cn("truncate text-sm font-semibold tracking-tight", isActive ? "text-foreground" : "text-foreground/90")}>
            {displayName}
          </span>
          <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{timestamp}</span>
        </div>

        <div className="flex items-center justify-between gap-1 mt-1">
          <p
            className={cn(
              "truncate text-xs tracking-tight",
              isTyping ? "text-primary font-semibold italic" : "text-muted-foreground/80 font-normal"
            )}
          >
            {preview}
          </p>
          {conversation.unread_count > 0 && !isTyping && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground shrink-0 shadow-xs">
              {conversation.unread_count}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
