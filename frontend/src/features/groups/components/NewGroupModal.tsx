"use client"

import { useQuery } from "@tanstack/react-query"
import { Check, Loader2, Search, Users, X } from "lucide-react"
import { useState } from "react"
import { Avatar } from "@/components/Avatar"
import { api } from "@/services/api"
import { useAuthStore } from "@/store/auth"
import type { User } from "@/types"
import { useGroupManagement } from "../hooks/useGroupManagement"

interface NewGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (groupId: number) => void
}

export function NewGroupModal({ isOpen, onClose, onCreated }: NewGroupModalProps) {
  const [name, setName] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const token = useAuthStore((state) => state.token)
  const currentUser = useAuthStore((state) => state.user)

  const { createGroup, isCreating } = useGroupManagement()

  // Fetch contacts
  const contactsQuery = useQuery<{ contact_user: User }[]>({
    queryKey: ["contacts"],
    queryFn: () => api.get("/contacts", token ?? undefined),
    enabled: isOpen && !!token,
  })

  // Search all registered users by query
  const userSearchQuery = useQuery<User[]>({
    queryKey: ["users", "search", searchQuery],
    queryFn: () => api.get(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`, token ?? undefined),
    enabled: isOpen && !!token && searchQuery.trim().length > 0,
  })

  if (!isOpen) return null

  const contacts = (contactsQuery.data || [])
    .map((c) => c.contact_user)
    .filter((u) => u.id !== currentUser?.id)

  const searchResults = (userSearchQuery.data || []).filter((u) => u.id !== currentUser?.id)

  // Merge list: search results take precedence if querying; otherwise show contacts
  const displayList: User[] = searchQuery.trim().length > 0
    ? searchResults
    : contacts

  const toggleUser = (user: User) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const selectedUserIds = selectedUsers.map((u) => u.id)
    if (!name.trim() || selectedUserIds.length === 0) return

    try {
      const conv = await createGroup({
        name: name.trim(),
        participant_ids: selectedUserIds,
      })
      onCreated(conv.id)
      onClose()
    } catch (err) {
      console.error("Failed to create group:", err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-[#1E1E1E] p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-bold text-lg text-foreground tracking-tight">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Users className="h-4 w-4" />
            </div>
            <span>New Group</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-[#2A2A2A] hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="group-name" className="text-xs font-semibold text-foreground">
              Group Name
            </label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Project Team"
              autoFocus
              className="w-full rounded-lg border border-border/60 bg-[#252525] px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Add Members ({selectedUsers.length} selected)
            </label>

            {/* Search Input for User Direct Lookup */}
            <div className="relative w-full mb-2">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by username..."
                className="w-full rounded-lg border border-border/60 bg-[#252525] py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="max-h-52 overflow-y-auto rounded-lg border border-border/60 bg-[#242424] p-1 space-y-1">
              {(contactsQuery.isLoading || userSearchQuery.isLoading) && (
                <div className="flex items-center justify-center gap-2 p-4 text-xs text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span>Searching...</span>
                </div>
              )}

              {displayList.length === 0 && !(contactsQuery.isLoading || userSearchQuery.isLoading) && (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  {searchQuery.trim().length > 0
                    ? `No users found matching "${searchQuery}"`
                    : "No contacts available. Use search above to find users by username."}
                </div>
              )}

              {displayList.map((user) => {
                const isSelected = selectedUsers.some((u) => u.id === user.id)
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => toggleUser(user)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-[#2C2C2C]"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={user.avatar_url} name={user.display_name} size="sm" />
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{user.display_name}</span>
                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border/60 px-4 py-2 text-xs font-semibold text-foreground hover:bg-[#2A2A2A] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || selectedUsers.length === 0 || isCreating}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary-hover active:scale-95 disabled:opacity-50"
            >
              {isCreating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
