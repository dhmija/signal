import { MessageSquare } from "lucide-react"

export default function ConversationsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center select-none bg-background">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <MessageSquare className="h-8 w-8" />
      </div>
      <div className="max-w-xs space-y-1">
        <h2 className="text-base font-semibold text-foreground">Select a conversation</h2>
        <p className="text-xs text-muted-foreground">
          Choose a chat from the sidebar or start a new conversation.
        </p>
      </div>
    </div>
  )
}
