"use client"

import { useQueryClient } from "@tanstack/react-query"
import { Loader2, MessageSquarePlus, Search, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Avatar } from "@/components/Avatar"
import { api } from "@/services/api"
import { useAuthStore } from "@/store/auth"
import type { Conversation, User } from "@/types"

interface NewChatModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectConversation: (conversationId: number) => void
}

export function NewChatModal({ isOpen, onClose, onSelectConversation }: NewChatModalProps) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const token = useAuthStore((state) => state.token)
  const currentUser = useAuthStore((state) => state.user)
  const queryClient = useQueryClient()

  // Debounce search query input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Query matching users when debouncedQuery changes
  useEffect(() => {
    if (!isOpen || !token || !debouncedQuery) return

    let isMounted = true

    const fetchUsers = async () => {
      try {
        const users = await api.get<User[]>(`/users/search?q=${encodeURIComponent(debouncedQuery)}`, token)
        if (!isMounted) return
        const filtered = (users || []).filter((u) => u.id !== currentUser?.id)
        setSearchResults(filtered)
        setError(null)
      } catch (err) {
        if (!isMounted) return
        console.error("Failed to search users:", err)
        setError("Failed to search users. Please try again.")
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchUsers()

    return () => {
      isMounted = false
    }
  }, [debouncedQuery, isOpen, token, currentUser?.id])

  if (!isOpen) return null

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (val.trim()) {
      setIsLoading(true)
    } else {
      setIsLoading(false)
      setSearchResults([])
      setError(null)
    }
  }

  const handleClose = () => {
    setQuery("")
    setDebouncedQuery("")
    setSearchResults([])
    setIsLoading(false)
    setIsCreating(false)
    setError(null)
    onClose()
  }

  const handleSelectUser = async (targetUser: User) => {
    if (!token || isCreating) return
    setIsCreating(true)
    setError(null)

    try {
      const conv = await api.post<Conversation>(
        "/conversations",
        {
          type: "direct",
          participant_ids: [targetUser.id],
        },
        token
      )
      await queryClient.invalidateQueries({ queryKey: ["conversations"] })
      onSelectConversation(conv.id)
      handleClose()
    } catch (err) {
      console.error("Failed to create direct conversation:", err)
      setError("Failed to start conversation. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  const displayResults = debouncedQuery ? searchResults : []
  const showEmptyState = debouncedQuery && !isLoading && !error && displayResults.length === 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg text-card-foreground">
            <MessageSquarePlus className="h-5 w-5 text-primary" />
            <span>New Chat</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search users by name or username..."
            autoFocus
            className="w-full rounded-lg border bg-input pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Search Results List / States */}
        <div className="max-h-64 overflow-y-auto rounded-lg border bg-input/40 p-1 space-y-1 min-h-[140px] flex flex-col justify-center">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>Searching users...</span>
            </div>
          )}

          {error && !isLoading && (
            <div className="p-4 text-center text-xs text-destructive">{error}</div>
          )}

          {!query.trim() && !isLoading && !error && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Type a name or username above to find people.
            </div>
          )}

          {showEmptyState && (
            <div className="p-4 text-center text-xs text-muted-foreground">
              No users found matching &quot;{debouncedQuery}&quot;.
            </div>
          )}

          {!isLoading &&
            !error &&
            displayResults.length > 0 &&
            displayResults.map((user) => (
              <button
                key={user.id}
                type="button"
                disabled={isCreating}
                onClick={() => handleSelectUser(user)}
                className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors hover:bg-signal-hover disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <Avatar src={user.avatar_url} name={user.display_name} size="sm" />
                  <div className="flex flex-col">
                    <span className="font-medium text-foreground">{user.display_name}</span>
                    <span className="text-xs text-muted-foreground">@{user.username}</span>
                  </div>
                </div>
              </button>
            ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
