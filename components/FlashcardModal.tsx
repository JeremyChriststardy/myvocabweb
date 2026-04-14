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
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)

  // Get words for the selected folder
  const words = folderId ? getWordsInFolder(folderId) : []
  const total = words.length
  const done = currentIndex + 1

  // Reset state when folder changes or modal opens
  useEffect(() => {
    setCurrentIndex(0)
    setFlipped(false)
    setCorrectCount(0)
    setIncorrectCount(0)
  }, [folderId, open])

  // Spacebar flip fix: listen on window, only when modal is open and not focused on an input
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault()
        setFlipped(f => !f)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open])

  if (!open || !folderId) return null

  const currentWord = words[currentIndex]

  // Handlers
  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1)
      setFlipped(false)
    }
  }
  const handleNext = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(i => i + 1)
      setFlipped(false)
    }
  }
  const handleCorrect = () => {
    setCorrectCount(c => c + 1)
    if (currentIndex < words.length - 1) {
      setCurrentIndex(i => i + 1)
      setFlipped(false)
    }
  }
  const handleIncorrect = () => {
    setIncorrectCount(c => c + 1)
    if (currentIndex < words.length - 1) {
      setCurrentIndex(i => i + 1)
      setFlipped(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      {/* Outer modal window */}
      <div
        ref={modalRef}
        className="relative bg-card rounded-2xl shadow-2xl flex flex-col items-center justify-center px-8 py-8"
        style={{ minWidth: 420, minHeight: 420 }}
      >
        {/* Close button */}
        <button
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground z-10"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>
        {/* Stats */}
        <div className="absolute top-4 left-4 text-xs font-semibold text-muted-foreground z-10">
          {done} / {total}
        </div>
        {/* Navigation buttons (left/right) */}
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-muted p-2 hover:bg-accent z-10"
          aria-label="Previous"
          disabled={currentIndex === 0}
          onClick={handlePrev}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-muted p-2 hover:bg-accent z-10"
          aria-label="Next"
          disabled={currentIndex === words.length - 1}
          onClick={handleNext}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
        {/* Centered flipping card */}
        <div className="flex flex-col items-center justify-center" style={{ minHeight: 260 }}>
          <div className="flashcard-perspective">
            <div
              className={cn(
                "flashcard-inner bg-background rounded-xl shadow-lg cursor-pointer",
                flipped && "flashcard-flipped"
              )}
              style={{ width: 320, minHeight: 180 }}
              onClick={() => setFlipped(f => !f)}
              tabIndex={0}
            >
              {/* Front Face */}
              <div className="flashcard-face">
                <div className="text-lg font-semibold mb-6">
                  {currentWord ? currentWord.word : "No words in this folder"}
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
        {/* Correct/Incorrect Buttons always visible below the card */}
        <div className="flex gap-6 mt-6">
          <button
            className="rounded-full bg-green-100 text-green-700 px-6 py-2 hover:bg-green-200 flex items-center gap-2 text-base font-semibold"
            aria-label="Mark Right"
            onClick={handleCorrect}
            disabled={!currentWord}
          >
            <Check className="w-5 h-5" />
            {correctCount}
          </button>
          <button
            className="rounded-full bg-red-100 text-red-700 px-6 py-2 hover:bg-red-200 flex items-center gap-2 text-base font-semibold"
            aria-label="Mark Wrong"
            onClick={handleIncorrect}
            disabled={!currentWord}
          >
            <XCircle className="w-5 h-5" />
            {incorrectCount}
          </button>
        </div>
      </div>
    </div>
  )
}