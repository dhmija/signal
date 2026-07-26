import type { ReactNode } from "react"

// Centered auth layout — Signal shows auth screens as full-page centered content
// with a subtle background, not as a modal over the app shell.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-12">
      {/* Signal wordmark */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
          {/* Signal-style pen/lock icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-8 w-8 text-primary-foreground"
            aria-hidden="true"
          >
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"
              fill="currentColor"
            />
          </svg>
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">Signal</span>
      </div>

      {children}
    </div>
  )
}
