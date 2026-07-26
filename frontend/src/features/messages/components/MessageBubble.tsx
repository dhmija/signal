"use client"

import { Check, CheckCheck, Clock } from "lucide-react"
import { cn, formatRelativeTime } from "@/lib/utils"
import type { Message } from "@/types"

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showSenderName?: boolean
  senderName?: string
}

export function MessageBubble({ message, isOwn, showSenderName, senderName }: MessageBubbleProps) {
  const isPending = message.status === "sending"
  const isDelivered = message.status === "delivered"
  const isRead = message.status === "read"

  return (
    <div
      className={cn(
        "flex w-full my-1 select-text",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "relative max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm break-words",
          isOwn
            ? "bg-signal-sent text-signal-sent-fg rounded-br-xs"
            : "bg-signal-received text-signal-received-fg rounded-bl-xs"
        )}
      >
        {!isOwn && showSenderName && senderName && (
          <span className="block text-xs font-semibold text-primary mb-0.5 select-none">
            {senderName}
          </span>
        )}

        <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>

        <div
          className={cn(
            "flex items-center justify-end gap-1 mt-1 text-[10px] opacity-70 select-none",
            isOwn ? "text-signal-sent-fg" : "text-signal-received-fg"
          )}
        >
          <span>{formatRelativeTime(message.created_at)}</span>

          {isOwn && (
            <span className="inline-flex items-center">
              {isPending && <Clock className="h-3 w-3 animate-pulse" />}
              {!isPending && !isDelivered && !isRead && <Check className="h-3 w-3" />}
              {isDelivered && <CheckCheck className="h-3 w-3" />}
              {isRead && <CheckCheck className="h-3 w-3 text-sky-300" />}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
