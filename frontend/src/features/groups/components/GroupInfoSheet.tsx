"use client"

import { useQuery } from "@tanstack/react-query"
import { LogOut, Plus, Shield, Trash2, UserPlus, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Avatar } from "@/components/Avatar"
import { api } from "@/services/api"
import { useAuthStore } from "@/store/auth"
import type { Conversation, User } from "@/types"
import { useGroupManagement } from "../hooks/useGroupManagement"

interface GroupInfoSheetProps {
  conversation: Conversation
  isOpen: boolean
  onClose: () => void
}

export function GroupInfoSheet({ conversation, isOpen, onClose }: GroupInfoSheetProps) {
  const router = useRouter()
  const token = useAuthStore((state) => state.token)
  const currentUser = useAuthStore((state) => state.user)

  const [isAddingMembers, setIsAddingMembers] = useState(false)

  const {
    members,
    isLoadingMembers,
    addMember,
    isAdding,
    removeMember,
    isRemoving,
    deleteGroup,
    isDeleting,
  } = useGroupManagement(conversation.id)

  // Fetch user contacts for adding members
  const contactsQuery = useQuery<{ contact_user: User }[]>({
    queryKey: ["contacts"],
    queryFn: () => api.get("/contacts", token ?? undefined),
    enabled: isOpen && isAddingMembers && !!token,
  })

  if (!isOpen) return null

  const currentMember = members.find((m) => m.user_id === currentUser?.id)
  const isAdmin = currentMember?.role === "admin"

  // Filter contacts not already in group
  const memberUserIds = new Set(members.map((m) => m.user_id))
  const availableContacts = (contactsQuery.data || [])
    .map((c) => c.contact_user)
    .filter((user) => !memberUserIds.has(user.id))

  const handleAddUser = async (userId: number) => {
    try {
      await addMember(userId)
    } catch (err) {
      console.error("Failed to add member:", err)
    }
  }

  const handleRemove = async (userId: number) => {
    if (confirm("Are you sure you want to remove this member?")) {
      try {
        await removeMember(userId)
      } catch (err) {
        console.error("Failed to remove member:", err)
      }
    }
  }

  const handleLeaveGroup = async () => {
    if (!currentUser) return
    if (confirm("Are you sure you want to leave this group?")) {
      try {
        await removeMember(currentUser.id)
        onClose()
        router.push("/conversations")
      } catch (err) {
        console.error("Failed to leave group:", err)
      }
    }
  }

  const handleDeleteGroup = async () => {
    if (confirm("Are you sure you want to delete this group? This cannot be undone.")) {
      try {
        await deleteGroup()
        onClose()
        router.push("/conversations")
      } catch (err) {
        console.error("Failed to delete group:", err)
      }
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l bg-card p-6 shadow-2xl space-y-6 select-none">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-base text-foreground">Group Info</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Avatar & Name */}
      <div className="flex flex-col items-center text-center space-y-2">
        <Avatar src={conversation.avatar_url} name={conversation.name || "Group"} size="lg" />
        <h4 className="font-semibold text-lg text-foreground">{conversation.name}</h4>
        <span className="text-xs text-muted-foreground">{members.length} members</span>
      </div>

      {/* Members List Section */}
      <div className="flex-1 flex flex-col overflow-hidden space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Members</span>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsAddingMembers((prev) => !prev)}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {isAddingMembers ? "Done" : "Add Member"}
            </button>
          )}
        </div>

        {/* Inline Add Member Picker for Admins */}
        {isAddingMembers && isAdmin && (
          <div className="max-h-40 overflow-y-auto rounded-lg border bg-input/40 p-1 space-y-1">
            <span className="block text-[11px] font-medium text-muted-foreground px-2 py-1">
              Select contact to add:
            </span>
            {contactsQuery.isLoading && (
              <div className="p-2 text-center text-xs text-muted-foreground">Loading contacts...</div>
            )}
            {availableContacts.length === 0 && !contactsQuery.isLoading && (
              <div className="p-2 text-center text-xs text-muted-foreground">No contacts available to add</div>
            )}
            {availableContacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => handleAddUser(contact.id)}
                disabled={isAdding}
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-signal-hover"
              >
                <div className="flex items-center gap-2">
                  <Avatar src={contact.avatar_url} name={contact.display_name} size="sm" />
                  <span className="font-medium text-foreground">{contact.display_name}</span>
                </div>
                <Plus className="h-3.5 w-3.5 text-primary" />
              </button>
            ))}
          </div>
        )}

        {/* Member List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {isLoadingMembers && (
            <div className="p-4 text-center text-xs text-muted-foreground">Loading members...</div>
          )}

          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg p-2 hover:bg-signal-hover transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar
                  src={member.user.avatar_url}
                  name={member.user.display_name}
                  size="sm"
                  isOnline={member.user.is_online}
                />
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">{member.user.display_name}</span>
                    {member.role === "admin" && (
                      <span className="flex items-center gap-0.5 rounded-xs bg-primary/20 px-1 py-0.2 text-[10px] font-semibold text-primary">
                        <Shield className="h-2.5 w-2.5" />
                        Admin
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">@{member.user.username}</span>
                </div>
              </div>

              {isAdmin && member.user_id !== currentUser?.id && (
                <button
                  type="button"
                  onClick={() => handleRemove(member.user_id)}
                  disabled={isRemoving}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                  title="Remove Member"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leave or Delete Group Actions */}
      <div className="border-t pt-4 space-y-2">
        {isAdmin ? (
          <button
            type="button"
            onClick={handleDeleteGroup}
            disabled={isDeleting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
          >
            <Trash2 className="h-4 w-4" />
            Delete Group
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLeaveGroup}
            disabled={isRemoving}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-destructive/10 px-4 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
          >
            <LogOut className="h-4 w-4" />
            Leave Group
          </button>
        )}
      </div>
    </div>
  )
}
