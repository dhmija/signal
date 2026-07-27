"use client"

import { Edit, LogOut, MessageSquarePlus } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Avatar } from "@/components/Avatar"
import { NewGroupModal } from "@/features/groups/components/NewGroupModal"
import { useAuthStore } from "@/store/auth"
import { ConversationList } from "./ConversationList"
import { NewChatModal } from "./NewChatModal"

export function Sidebar() {
  const { user, logout } = useAuthStore()
  const router = useRouter()
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const handleConversationSelected = (conversationId: number) => {
    router.push(`/conversations/${conversationId}`)
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
            onClick={() => setIsChatModalOpen(true)}
            className="rounded-full p-2 hover:bg-signal-hover hover:text-foreground transition-colors"
            title="New Chat"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
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

      {/* Modals */}
      <NewChatModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
        onSelectConversation={handleConversationSelected}
      />
      <NewGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onCreated={handleConversationSelected}
      />
    </aside>
  )
}
