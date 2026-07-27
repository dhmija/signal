"use client"

import { cn } from "@/lib/utils"

interface SignalLogoProps {
  className?: string
  size?: number
}

export function SignalLogo({ className, size = 32 }: SignalLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-label="Signal Logo"
    >
      {/* Blue Speech Bubble Body */}
      <path
        d="M50 8C25.7 8 6 26.6 6 49.5C6 60.1 10.3 69.8 17.5 77C16.2 84.5 12.8 90.8 7 94.5C18.2 94.5 27.5 89.2 33.8 84.6C38.8 86.8 44.3 88 50 88C74.3 88 94 69.4 94 46.5C94 23.6 74.3 8 50 8Z"
        fill="#2C6BED"
      />
      {/* White Dashed Outline representing Encryption Trails */}
      <path
        d="M50 14C28.8 14 11.5 30.2 11.5 50.2C11.5 59.5 15.2 68 21.5 74.3L22.6 75.4L22.1 76.9C20.8 80.8 18.5 84.5 15 87.8C22.2 87.2 28.5 83.9 33.2 80.2L34.6 79.1L36.2 79.7C40.6 81.5 45.2 82.5 50 82.5C71.2 82.5 88.5 66.3 88.5 46.3C88.5 26.3 71.2 14 50 14Z"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="8 6"
        fill="none"
      />
    </svg>
  )
}
