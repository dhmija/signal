"use client"

import { useQuery } from "@tanstack/react-query"
import { LogOut, Plus, Search, Shield, Trash2, UserPlus, X } from "lucide-react"
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
  const [searchQuery, setSearchQuery] = useState("")

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

  // Fetch recent conversations for quick member suggestion
  const conversationsQuery = useQuery<Conversation[]>({
    queryKey: ["conversations"],
    queryFn: () => api.get("/conversations", token ?? undefined),
    enabled: isOpen && isAddingMembers && !!token,
  })

  // Fetch user contacts for suggestions
  const contactsQuery = useQuery<{ contact_user: User }[]>({
    queryKey: ["contacts"],
    queryFn: () => api.get("/contacts", token ?? undefined),
    enabled: isOpen && isAddingMembers && !!token,
  })

  // Search all registered users by username for adding new members
  const userSearchQuery = useQuery<User[]>({
    queryKey: ["users", "search", searchQuery],
    queryFn: () => api.get(`/users/search?q=${encodeURIComponent(searchQuery.trim())}`, token ?? undefined),
    enabled: isOpen && isAddingMembers && !!token && searchQuery.trim().length > 0,
  })

  if (!isOpen) return null

  const currentMember = members.find((m) => m.user_id === currentUser?.id)
  const isAdmin = currentMember?.role === "admin"

  const memberUserIds = new Set(members.map((m) => m.user_id))

  // Collect unique users from recent conversations
  const recentUsersMap = new Map<number, User>()
  for (const c of conversationsQuery.data || []) {
    for (const p of c.participants) {
      if (p.id !== currentUser?.id && !memberUserIds.has(p.id)) {
        recentUsersMap.set(p.id, p)
      }
    }
  }

  // Collect unique users from contacts
  for (const c of contactsQuery.data || []) {
    const u = c.contact_user
    if (u.id !== currentUser?.id && !memberUserIds.has(u.id)) {
      recentUsersMap.set(u.id, u)
    }
  }

  const suggestedUsers = Array.from(recentUsersMap.values())
  const searchResults = (userSearchQuery.data || []).filter(
    (u) => u.id !== currentUser?.id && !memberUserIds.has(u.id)
  )

  const availableAddList: User[] = searchQuery.trim().length > 0
    ? searchResults
    : suggestedUsers

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
    <div className="fixed inset-y-0 right-0 z-50 flex w-80 flex-col border-l border-border/60 bg-[#1E1E1E] p-6 shadow-2xl space-y-6 select-none animate-in slide-in-from-right duration-200">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-base text-foreground tracking-tight">Group Details</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-1.5 text-muted-foreground hover:bg-[#2A2A2A] hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Avatar & Name */}
      <div className="flex flex-col items-center text-center space-y-2">
        <Avatar src={conversation.avatar_url} name={conversation.name || "Group"} size="lg" />
        <h4 className="font-bold text-lg tracking-tight text-foreground">{conversation.name}</h4>
        <span className="text-xs font-medium text-muted-foreground">{members.length} members</span>
      </div>

      {/* Members List Section */}
      <div className="flex-1 flex flex-col overflow-hidden space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <span>Members</span>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsAddingMembers((prev) => !prev)}
              className="flex items-center gap-1 text-primary hover:underline font-semibold cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {isAddingMembers ? "Done" : "Add Member"}
            </button>
          )}
        </div>

        {/* Inline Add Member Picker with Search */}
        {isAddingMembers && isAdmin && (
          <div className="rounded-lg border border-border/60 bg-[#252525] p-2 space-y-2">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search username or contacts..."
                className="w-full rounded-md border border-border/40 bg-[#1E1E1E] py-1.5 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
              />
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1">
              {(contactsQuery.isLoading || userSearchQuery.isLoading) && (
                <div className="p-2 text-center text-xs text-muted-foreground">Searching...</div>
              )}
              {availableAddList.length === 0 && !(contactsQuery.isLoading || userSearchQuery.isLoading) && (
                <div className="p-2 text-center text-xs text-muted-foreground">
                  {searchQuery.trim().length > 0 ? "No matching users found" : "No suggestions available"}
                </div>
              )}
              {availableAddList.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleAddUser(user.id)}
                  disabled={isAdding}
                  className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-[#2F2F2F] cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Avatar src={user.avatar_url} name={user.display_name} size="sm" />
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground">{user.display_name}</span>
                      <span className="text-[10px] text-muted-foreground">@{user.username}</span>
                    </div>
                  </div>
                  <Plus className="h-3.5 w-3.5 text-primary" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Member List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {isLoadingMembers && (
            <div className="p-4 text-center text-xs text-muted-foreground">Loading members...</div>
          )}

          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-xl p-2 hover:bg-[#252525] transition-colors"
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
                    <span className="text-sm font-semibold text-foreground">{member.user.display_name}</span>
                    {member.role === "admin" && (
                      <span className="flex items-center gap-0.5 rounded-full bg-primary/20 px-1.5 py-0.5 text-[10px] font-bold text-primary">
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
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-colors cursor-pointer"
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
      <div className="border-t border-border/60 pt-4 space-y-2">
        {isAdmin ? (
          <button
            type="button"
            onClick={handleDeleteGroup}
            disabled={isDeleting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/15 px-4 py-2.5 text-xs font-bold text-destructive transition-all hover:bg-destructive/25 cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
            Delete Group
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLeaveGroup}
            disabled={isRemoving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/15 px-4 py-2.5 text-xs font-bold text-destructive transition-all hover:bg-destructive/25 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Leave Group
          </button>
        )}
      </div>
    </div>
  )
}
