"use client"

import Image from "next/image"
import { useState } from "react"
import { cn, getInitials } from "@/lib/utils"

interface AvatarProps {
  src?: string | null
  name: string
  size?: "sm" | "md" | "lg"
  isOnline?: boolean
  className?: string
}

const sizeMap = {
  sm: { container: "h-8 w-8 text-xs", badge: "h-2.5 w-2.5 ring-1", pixels: 32 },
  md: { container: "h-10 w-10 text-sm", badge: "h-3 w-3 ring-2", pixels: 40 },
  lg: { container: "h-14 w-14 text-base", badge: "h-3.5 w-3.5 ring-2", pixels: 56 },
}

export function Avatar({ src, name, size = "md", isOnline, className }: AvatarProps) {
  const [imageError, setImageError] = useState(false)
  const config = sizeMap[size]
  const initials = getInitials(name)

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={cn(
          "relative flex items-center justify-center overflow-hidden rounded-full bg-muted font-medium text-muted-foreground select-none",
          config.container,
          className
        )}
      >
        {src && !imageError ? (
          <Image
            src={src}
            alt={name}
            width={config.pixels}
            height={config.pixels}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <span>{initials || "?"}</span>
        )}
      </div>

      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-background",
            isOnline ? "bg-emerald-500" : "bg-muted-foreground/40",
            config.badge
          )}
        />
      )}
    </div>
  )
}
