"use client"

import { FileText, Loader2, Paperclip, Send, Smile, X } from "lucide-react"
import { useRef, useState } from "react"
import { useAuthStore } from "@/store/auth"
import { useSocketStore } from "@/store/socket"
import type { Attachment, Message } from "@/types"

interface MessageInputProps {
  conversationId: number
  recipientId: number | null
  replyingTo: Message | null
  onCancelReply: () => void
  onSend: (payload: { body: string; reply_to_id?: number | null; attachments?: Partial<Attachment>[] }) => void
  disabled?: boolean
}

export function MessageInput({
  conversationId,
  recipientId,
  replyingTo,
  onCancelReply,
  onSend,
  disabled,
}: MessageInputProps) {
  const [text, setText] = useState("")
  const [attachments, setAttachments] = useState<Partial<Attachment>[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const token = useAuthStore((state) => state.token)
  const sendTyping = useSocketStore((state) => state.sendTyping)

  const handleTextChange = (value: string) => {
    setText(value)

    if (recipientId) {
      sendTyping(conversationId, recipientId, true)

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(conversationId, recipientId, false)
      }, 2000)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", files[0])

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/messages/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!res.ok) throw new Error("Upload failed")

      const data = await res.json()
      setAttachments((prev) => [...prev, data])
    } catch (err) {
      console.error("File upload error:", err)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if ((!text.trim() && attachments.length === 0) || disabled || isUploading) return

    onSend({
      body: text.trim(),
      reply_to_id: replyingTo?.id || null,
      attachments: attachments.length > 0 ? attachments : undefined,
    })

    setText("")
    setAttachments([])
    onCancelReply()

    if (recipientId) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      sendTyping(conversationId, recipientId, false)
    }
  }

  return (
    <div className="flex flex-col border-t bg-background shrink-0">
      {/* Quoted Reply Preview Bar */}
      {replyingTo && (
        <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2 text-xs select-none">
          <div className="flex items-center gap-2 overflow-hidden border-l-2 border-primary pl-2">
            <span className="font-semibold text-primary">Replying to:</span>
            <p className="truncate text-muted-foreground">{replyingTo.body}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Attachment Preview Thumbnails */}
      {attachments.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 border-b overflow-x-auto">
          {attachments.map((att, idx) => (
            <div key={idx} className="relative flex items-center gap-2 rounded-lg border bg-card p-2 text-xs">
              <FileText className="h-4 w-4 text-primary shrink-0" />
              <span className="truncate max-w-[120px] font-medium">{att.file_name}</span>
              <button
                type="button"
                onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Row */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || disabled}
          className="rounded-full p-2 text-muted-foreground hover:bg-signal-hover hover:text-foreground transition-colors disabled:opacity-50"
          title="Attach File"
        >
          {isUploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Paperclip className="h-5 w-5" />}
        </button>

        <button
          type="button"
          className="rounded-full p-2 text-muted-foreground hover:bg-signal-hover hover:text-foreground transition-colors"
          title="Emoji"
        >
          <Smile className="h-5 w-5" />
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Signal message"
          disabled={disabled}
          className="flex-1 rounded-full border bg-input px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />

        <button
          type="submit"
          disabled={(!text.trim() && attachments.length === 0) || disabled || isUploading}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          title="Send Message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}
