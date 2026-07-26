"use client"

import { useQuery } from "@tanstack/react-query"
import { Check, Loader2, Users, X } from "lucide-react"
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
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const token = useAuthStore((state) => state.token)

  const { createGroup, isCreating } = useGroupManagement()

  const contactsQuery = useQuery<{ contact_user: User }[]>({
    queryKey: ["contacts"],
    queryFn: () => api.get("/contacts", token ?? undefined),
    enabled: isOpen && !!token,
  })

  if (!isOpen) return null

  const contacts = (contactsQuery.data || []).map((c) => c.contact_user)

  const toggleUser = (userId: number) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-lg text-card-foreground">
            <Users className="h-5 w-5 text-primary" />
            <span>New Group</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="group-name" className="text-xs font-medium text-muted-foreground">
              Group Name
            </label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Backend Team"
              autoFocus
              className="w-full rounded-lg border bg-input px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Select Members ({selectedUserIds.length})
            </label>
            <div className="max-h-56 overflow-y-auto rounded-lg border bg-input/40 p-1 space-y-1">
              {contactsQuery.isLoading && (
                <div className="p-4 text-center text-xs text-muted-foreground">Loading contacts...</div>
              )}

              {contacts.length === 0 && !contactsQuery.isLoading && (
                <div className="p-4 text-center text-xs text-muted-foreground">No contacts available. Add contacts first.</div>
              )}

              {contacts.map((contact) => {
                const isSelected = selectedUserIds.includes(contact.id)
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => toggleUser(contact.id)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-signal-hover"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar src={contact.avatar_url} name={contact.display_name} size="sm" />
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{contact.display_name}</span>
                        <span className="text-xs text-muted-foreground">@{contact.username}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
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
              className="rounded-lg border px-4 py-2 text-xs font-medium text-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || selectedUserIds.length === 0 || isCreating}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
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
