import { SignalLogo } from "@/components/SignalLogo"

export default function ConversationsPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center select-none bg-background">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-card border border-border/40 shadow-sm transition-transform hover:scale-105">
        <SignalLogo size={48} />
      </div>
      <div className="max-w-xs space-y-1.5">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Select a conversation</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Choose a chat from the sidebar or start a new conversation to speak freely.
        </p>
      </div>
    </div>
  )
}
