"use client"

import { Check, CheckCheck, Clock, FileText, Download, Reply, Smile } from "lucide-react"
import Image from "next/image"
import { useMemo, useState } from "react"
import { API_BASE } from "@/lib/constants"
import { cn, formatRelativeTime } from "@/lib/utils"
import { useAuthStore } from "@/store/auth"
import type { Message } from "@/types"

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  showSenderName?: boolean
  senderName?: string
  onReply?: (message: Message) => void
  onToggleReaction?: (messageId: number, emoji: string) => void
}

const EMOJI_OPTIONS = ["❤️", "👍", "😂", "😮", "😢", "🙏"]

export function MessageBubble({
  message,
  isOwn,
  showSenderName,
  senderName,
  onReply,
  onToggleReaction,
}: MessageBubbleProps) {
  const currentUser = useAuthStore((state) => state.user)
  const [showPicker, setShowPicker] = useState(false)

  const isPending = message.status === "sending"
  const isDelivered = message.status === "delivered"
  const isRead = message.status === "read"

  // Group reactions by emoji
  const reactionGroups = useMemo(() => {
    const map = new Map<string, { count: number; users: number[]; hasReacted: boolean }>()
    for (const r of message.reactions || []) {
      const existing = map.get(r.emoji) || { count: 0, users: [], hasReacted: false }
      existing.count += 1
      existing.users.push(r.user_id)
      if (r.user_id === currentUser?.id) existing.hasReacted = true
      map.set(r.emoji, existing)
    }
    return Array.from(map.entries())
  }, [message.reactions, currentUser?.id])

  return (
    <div
      className={cn(
        "group relative flex w-full my-1.5 px-2 select-text",
        isOwn ? "justify-end" : "justify-start"
      )}
    >
      {/* Message Box Wrapper (Includes Bubble + Action Buttons inline) */}
      <div
        className={cn(
          "relative flex items-center gap-2 max-w-[80%]",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}
      >
        {/* Main Message Bubble */}
        <div
          className={cn(
            "relative rounded-[18px] px-3.5 py-2 text-sm shadow-xs break-words flex flex-col space-y-1 min-w-[100px]",
            isOwn
              ? "bg-[#1054DB] text-white rounded-br-[4px]"
              : "bg-[#282828] text-foreground rounded-bl-[4px]"
          )}
        >
          {!isOwn && showSenderName && senderName && (
            <span className="block text-xs font-semibold text-primary mb-0.5 select-none">
              {senderName}
            </span>
          )}

          {/* Quoted Reply Quote Box */}
          {message.reply_to && (
            <div
              className={cn(
                "rounded-lg p-2 text-xs border-l-2 mb-1 select-none",
                isOwn
                  ? "bg-primary-foreground/10 border-primary-foreground/40 text-signal-sent-fg"
                  : "bg-muted/60 border-primary text-foreground"
              )}
            >
              <span className="font-semibold block text-[11px]">
                {message.reply_to.sender?.display_name || "Reply"}
              </span>
              <p className="truncate opacity-90">{message.reply_to.body}</p>
            </div>
          )}

          {/* File Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-1.5 my-1">
              {message.attachments.map((att, index) => {
                const fullUrl = att.file_url.startsWith("http") ? att.file_url : `${API_BASE}${att.file_url}`
                const isImage = att.mime_type.startsWith("image/")
                const itemKey = att.id ? `att-${att.id}` : `att-idx-${index}`

                return isImage ? (
                  <div key={itemKey} className="relative overflow-hidden rounded-xl max-h-60 max-w-sm border">
                    <Image
                      src={fullUrl}
                      alt={att.file_name}
                      width={320}
                      height={240}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  </div>
                ) : (
                  <a
                    key={itemKey}
                    href={fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg p-2.5 text-xs transition-colors border select-none",
                      isOwn
                        ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20"
                        : "bg-muted border-border hover:bg-muted/80"
                    )}
                  >
                    <FileText className="h-5 w-5 shrink-0 text-primary" />
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium">{att.file_name}</p>
                      <span className="text-[10px] opacity-70">
                        {(att.size_bytes / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    <Download className="h-4 w-4 shrink-0 opacity-70" />
                  </a>
                )
              })}
            </div>
          )}

          {/* Message Body */}
          {message.body && <p className="whitespace-pre-wrap leading-relaxed">{message.body}</p>}

          {/* Reaction Pills Container */}
          {reactionGroups.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 pt-0.5 select-none">
              {reactionGroups.map(([emoji, group]) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onToggleReaction?.(message.id, emoji)}
                  className={cn(
                    "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs border transition-all cursor-pointer",
                    group.hasReacted
                      ? isOwn
                        ? "bg-white/20 border-white/40 text-white font-semibold"
                        : "bg-primary/20 border-primary/40 text-primary font-semibold"
                      : isOwn
                        ? "bg-black/20 border-transparent text-white/90 hover:bg-black/30"
                        : "bg-white/5 border-transparent text-foreground/90 hover:bg-white/10"
                  )}
                >
                  <span>{emoji}</span>
                  <span className="text-[10px]">{group.count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Status and Timestamp Footer */}
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

        {/* Action Buttons (Reply & React) - Always visible next to bubble */}
        <div className="flex items-center gap-1 shrink-0">
          {onReply && (
            <button
              type="button"
              onClick={() => onReply(message)}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Reply to message"
            >
              <Reply className="h-4 w-4" />
            </button>
          )}
          {onToggleReaction && (
            <button
              type="button"
              onClick={() => setShowPicker((prev) => !prev)}
              className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="React to message"
            >
              <Smile className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Emoji Picker Popup */}
        {showPicker && (
          <div
            className={cn(
              "absolute -top-11 flex items-center gap-1.5 rounded-full border border-border/80 bg-card px-3 py-1.5 shadow-xl z-40 animate-in fade-in zoom-in-95 duration-100",
              isOwn ? "right-0" : "left-0"
            )}
          >
            {EMOJI_OPTIONS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  onToggleReaction?.(message.id, emoji)
                  setShowPicker(false)
                }}
                className="text-lg transition-transform hover:scale-125 px-0.5"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
