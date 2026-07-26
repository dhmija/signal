"use client"

import { Edit, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Avatar } from "@/components/Avatar"
import { NewGroupModal } from "@/features/groups/components/NewGroupModal"
import { useAuthStore } from "@/store/auth"
import { ConversationList } from "./ConversationList"

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleGroupCreated = (groupId: number) => {
    router.push(`/conversations/${groupId}`)
  }

  return (
    <aside className="flex h-full w-80 flex-col border-r bg-signal-sidebar shrink-0 select-none">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-4">
        <div className="flex items-center gap-3">
          {user && (
            <Avatar
              src={user.avatar_url}
              name={user.display_name}
              size="sm"
            />
          )}
          <span className="font-semibold text-sm text-foreground">Chats</span>
        </div>

        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            type="button"
            onClick={() => setIsGroupModalOpen(true)}
            className="rounded-full p-2 hover:bg-signal-hover hover:text-foreground transition-colors"
            title="New Group"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full p-2 hover:bg-signal-hover hover:text-foreground transition-colors"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Conversation list */}
      <ConversationList />

      {/* New Group Modal */}
      <NewGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onCreated={handleGroupCreated}
      />
    </aside>
  )
}
