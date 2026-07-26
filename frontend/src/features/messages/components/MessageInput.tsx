"use client"

import { Send, Smile } from "lucide-react"
import { useRef, useState } from "react"
import { useSocketStore } from "@/store/socket"

interface MessageInputProps {
  conversationId: number
  recipientId: number | null
  onSend: (text: string) => void
  disabled?: boolean
}

export function MessageInput({ conversationId, recipientId, onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState("")
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || disabled) return

    onSend(text.trim())
    setText("")

    if (recipientId) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      sendTyping(conversationId, recipientId, false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 border-t p-3 bg-background shrink-0"
    >
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
        disabled={!text.trim() || disabled}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        title="Send Message"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  )
}
