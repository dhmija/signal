"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Download, X } from "lucide-react"
import Image from "next/image"
import { useEffect } from "react"

interface ImageViewerModalProps {
  src: string | null
  alt?: string
  onClose: () => void
}

export function ImageViewerModal({ src, alt = "Image attachment", onClose }: ImageViewerModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  if (!src) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xs p-4 select-none"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 rounded-full bg-white/10 p-2.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          title="Close (Esc)"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Download Button */}
        <a
          href={src}
          download
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="absolute top-4 right-16 z-10 rounded-full bg-white/10 p-2.5 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          title="Download Image"
        >
          <Download className="h-5 w-5" />
        </a>

        {/* Image Content */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-xl shadow-2xl flex items-center justify-center"
        >
          <Image
            src={src}
            alt={alt}
            width={1200}
            height={900}
            className="max-h-[85vh] max-w-[85vw] w-auto h-auto object-contain rounded-xl"
            unoptimized
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
