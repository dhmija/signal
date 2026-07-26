"use client"

import { MoreVertical, Phone, Video } from "lucide-react"
import { Avatar } from "@/components/Avatar"
import { useAuthStore } from "@/store/auth"
import { useSocketStore } from "@/store/socket"
import type { Conversation } from "@/types"

interface ConversationHeaderProps {
  conversation: Conversation
}

export function ConversationHeader({ conversation }: ConversationHeaderProps) {
  const currentUser = useAuthStore((state) => state.user)
  const typingUsers = useSocketStore((state) => state.typingUsers[conversation.id])
  const isTyping = typingUsers && typingUsers.size > 0

  let name = conversation.name
  let avatarUrl = conversation.avatar_url
  let isOnline: boolean | undefined = undefined
  let subtitle = ""

  if (conversation.type === "direct") {
    const otherParticipant = conversation.participants.find(
      (p) => p.id !== currentUser?.id
    )
    if (otherParticipant) {
      name = otherParticipant.display_name
      avatarUrl = otherParticipant.avatar_url
      isOnline = otherParticipant.is_online
      subtitle = isTyping ? "Typing..." : isOnline ? "Online" : "Offline"
    }
  } else {
    subtitle = isTyping ? "Someone is typing..." : `${conversation.participants.length} members`
  }

  const displayName = name || "Direct Message"

  return (
    <div className="flex h-14 items-center justify-between border-b px-4 bg-background shrink-0 select-none">
      <div className="flex items-center gap-3">
        <Avatar
          src={avatarUrl}
          name={displayName}
          size="sm"
          isOnline={conversation.type === "direct" ? isOnline : undefined}
        />
        <div className="flex flex-col">
          <span className="text-sm font-semibold leading-none text-foreground">
            {displayName}
          </span>
          {subtitle && (
            <span className="text-xs text-muted-foreground mt-0.5 leading-none">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 text-muted-foreground">
        <button
          type="button"
          className="rounded-full p-2 hover:bg-signal-hover hover:text-foreground transition-colors"
          title="Voice Call"
        >
          <Phone className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-full p-2 hover:bg-signal-hover hover:text-foreground transition-colors"
          title="Video Call"
        >
          <Video className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="rounded-full p-2 hover:bg-signal-hover hover:text-foreground transition-colors"
          title="More options"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
