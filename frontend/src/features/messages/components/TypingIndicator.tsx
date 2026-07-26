"use client"

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-2 text-xs text-muted-foreground select-none">
      <div className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
      </div>
    </div>
  )
}
