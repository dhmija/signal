// Placeholder rendered inside the app shell when no conversation is selected.
// Phase 2 replaces this with the full sidebar + empty state panel.
export default function ConversationsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-muted-foreground">Select a conversation to start messaging</p>
    </div>
  )
}
