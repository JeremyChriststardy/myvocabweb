import { useEffect, useRef, useState } from "react"
import { X, ChevronLeft, ChevronRight, Check, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/app-context"


interface FlashcardModalProps {
  open: boolean
  onClose: () => void
  folderId?: string | null

}

export function FlashcardModal({ open, onClose, folderId }: FlashcardModalProps) {
    const { getWordsInFolder } = useApp()
  const [flipped, setFlipped] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)

  // Get words for the selected folder
  const words = folderId ? getWordsInFolder(folderId) : []

  // Reset state when folder changes or modal opens
  useEffect(() => {
    setCurrentIndex(0)
    setFlipped(false)
  }, [folderId, open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault()
        setFlipped((f) => !f)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open])

  if (!open || !folderId) return null

   const currentWord = words[currentIndex]

  // ...existing imports and code...

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="flashcard-perspective">
        <div
          ref={modalRef}
          className={cn(
            "flashcard-inner bg-card rounded-xl shadow-2xl",
            flipped && "flashcard-flipped"
          )}
          tabIndex={-1}
          style={{ width: 350, minHeight: 220 }}
        >
          {/* Close button (positioned absolutely) */}
          <button
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground z-10"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          {/* Front Face */}
          <div className="flashcard-face">
            <div className="text-lg font-semibold mb-6">
              {currentWord ? currentWord.word : "No words in this folder"}
            </div>
            <div className="flex gap-3 mt-8">
              <button
                className="rounded-full bg-muted p-2 hover:bg-accent"
                aria-label="Previous"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button className="rounded-full bg-green-100 text-green-700 p-2 hover:bg-green-200" aria-label="Mark Right">
                <Check className="w-5 h-5" />
              </button>
              <button className="rounded-full bg-red-100 text-red-700 p-2 hover:bg-red-200" aria-label="Mark Wrong">
                <XCircle className="w-5 h-5" />
              </button>
              <button
                className="rounded-full bg-muted p-2 hover:bg-accent"
                aria-label="Next"
                disabled={currentIndex === words.length - 1}
                onClick={() => setCurrentIndex((i) => Math.min(words.length - 1, i + 1))}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Back Face */}
          <div className="flashcard-face flashcard-back">
            <div className="text-lg font-semibold mb-6">
              {currentWord ? currentWord.definition : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}