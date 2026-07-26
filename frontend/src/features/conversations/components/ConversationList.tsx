"use client"

import { useMemo, useState } from "react"
import { useConversations } from "../hooks/useConversations"
import { ConversationItem } from "./ConversationItem"
import { ConversationSearch } from "./ConversationSearch"
import { useAuthStore } from "@/store/auth"

export function ConversationList() {
  const { data: conversations, isLoading, isError } = useConversations()
  const [search, setSearch] = useState("")
  const currentUser = useAuthStore((state) => state.user)

  const filteredConversations = useMemo(() => {
    if (!conversations) return []
    if (!search.trim()) return conversations

    const term = search.toLowerCase().trim()
    return conversations.filter((c) => {
      if (c.type === "group" && c.name?.toLowerCase().includes(term)) {
        return true
      }
      return c.participants.some(
        (p) =>
          p.id !== currentUser?.id &&
          (p.display_name.toLowerCase().includes(term) ||
            p.username.toLowerCase().includes(term))
      )
    })
  }, [conversations, search, currentUser])

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="p-3">
        <ConversationSearch value={search} onChange={setSearch} />
      </div>

      <div className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {isLoading && (
          <div className="p-4 text-center text-xs text-muted-foreground">
            Loading conversations...
          </div>
        )}

        {isError && (
          <div className="p-4 text-center text-xs text-destructive">
            Failed to load conversations.
          </div>
        )}

        {!isLoading && !isError && filteredConversations.length === 0 && (
          <div className="p-4 text-center text-xs text-muted-foreground">
            {search ? "No conversations found" : "No chats yet"}
          </div>
        )}

        {filteredConversations.map((conversation) => (
          <ConversationItem key={conversation.id} conversation={conversation} />
        ))}
      </div>
    </div>
  )
}
