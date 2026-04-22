import { useEffect, useRef, useState } from "react"
import { X, ChevronLeft, ChevronRight, Check, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/app-context"

interface FlashcardModalProps {
  open: boolean
  onClose: () => void
  folderId?: string | null
}

function PieChart({ got, missed, skipped }: { got: number, missed: number, skipped: number }) {
  const total = got + missed + skipped
  const gotAngle = (got / total) * 360
  const missedAngle = (missed / total) * 360
  const skippedAngle = 360 - gotAngle - missedAngle

  // Pie chart segments
  const getPath = (startAngle: number, angle: number) => {
    const r = 40, cx = 50, cy = 50
    const rad = (deg: number) => (Math.PI / 180) * deg
    const x1 = cx + r * Math.cos(rad(startAngle))
    const y1 = cy + r * Math.sin(rad(startAngle))
    const x2 = cx + r * Math.cos(rad(startAngle + angle))
    const y2 = cy + r * Math.sin(rad(startAngle + angle))
    const largeArc = angle > 180 ? 1 : 0
    return [
      `M ${cx} ${cy}`,
      `L ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
      'Z'
    ].join(' ')
  }
  let start = 0
  const gotPath = <path d={getPath(start, gotAngle)} fill="#22c55e" /> // green
  start += gotAngle
  const missedPath = <path d={getPath(start, missedAngle)} fill="#ef4444" /> // red
  start += missedAngle
  const skippedPath = <path d={getPath(start, skippedAngle)} fill="#a3a3a3" /> // gray

  return (
    <svg width={100} height={100} viewBox="0 0 100 100">
      {gotPath}
      {missedPath}
      {skippedPath}
    </svg>
  )
}

export function FlashcardModal({ open, onClose, folderId }: FlashcardModalProps) {
  const { getWordsInFolder } = useApp()
  const [flipped, setFlipped] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)
  const modalRef = useRef<HTMLDivElement>(null)

  const [showStats, setShowStats] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [endTime, setEndTime] = useState<number | null>(null)
  const [skippedCount, setSkippedCount] = useState(0)
  const [confetti, setConfetti] = useState(false)

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
  setSkippedCount(0)
  setShowStats(false)
  setConfetti(false)
  setStartTime(Date.now())
  setEndTime(null)
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

  useEffect(() => {
  if (open) {
    modalRef.current?.focus();
  }
  }, [open]);

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
    } else {
    handleFinish()
    }
  }
  const handleCorrect = () => {
  setCorrectCount(c => c + 1)
  if (currentIndex < words.length - 1) {
    setCurrentIndex(i => i + 1)
    setFlipped(false)
  } else {
    handleFinish()
  }
}
const handleIncorrect = () => {
  setIncorrectCount(c => c + 1)
  if (currentIndex < words.length - 1) {
    setCurrentIndex(i => i + 1)
    setFlipped(false)
  } else {
    handleFinish()
  }
}

  const handleFinish = () => {
  setEndTime(Date.now())
  setShowStats(true)
  setConfetti(true)
  setTimeout(() => setConfetti(false), 1500) // Hide confetti after 1.5s
  }

  const renderConfetti = () => {
  if (!confetti) return null
  const colors = ['#22c55e', '#ef4444', '#a3a3a3', '#facc15', '#3b82f6']
  return Array.from({ length: 30 }).map((_, i) => (
    <div
      key={i}
      className="confetti-piece"
      style={{
        left: `${Math.random() * 100}%`,
        background: colors[i % colors.length],
        animationDelay: `${Math.random()}s`
      }}
    />
  ))
}

  if (showStats) {
  const total = correctCount + incorrectCount + skippedCount
  const percent = total ? Math.round((correctCount / total) * 100) : 0
  const timeTaken = endTime && startTime ? ((endTime - startTime) / 1000).toFixed(1) : "0.0"
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="relative bg-card rounded-2xl shadow-2xl flex flex-col items-center justify-center px-8 py-8" style={{ minWidth: 420, minHeight: 420 }}>
        {renderConfetti()}
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-8">
            <PieChart got={correctCount} missed={incorrectCount} skipped={skippedCount} />
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <span className="text-green-600 font-bold">Got it</span>
                <span className="text-lg">{correctCount}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-red-600 font-bold">Missed</span>
                <span className="text-lg">{incorrectCount}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-600 font-bold">Skipped</span>
                <span className="text-lg">{skippedCount}</span>
              </div>
            </div>
          </div>
          <div className="text-center mt-2">
            <div className="text-2xl font-bold">{correctCount}/{total}</div>
            <div className="text-sm text-muted-foreground">{percent}% correct</div>
            <div className="text-xs text-muted-foreground mt-2">Time: {timeTaken} seconds</div>
          </div>
          <button
            className="mt-6 rounded bg-primary text-primary-foreground px-6 py-2 font-semibold"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
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
      {/* Centered flipping card (shows word only when not flipped) */}
      <div className="flex flex-col items-center justify-center" style={{ minHeight: 260 }}>
        {!flipped && (
          <div className="flashcard-perspective">
            <div
              className={cn(
                "flashcard-inner bg-background rounded-xl shadow-lg cursor-pointer flex items-center justify-center border-2 border-black",
                flipped && "flashcard-flipped"
              )}
              style={{ width: 320, minHeight: 180 }}
              onClick={() => setFlipped(f => !f)}
              tabIndex={0}
            >
              <div className="flashcard-face flex items-center justify-center w-full h-full">
                <div className="text-lg font-semibold">
                  {currentWord ? currentWord.word : "No words in this folder"}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Definition in big window, only when flipped */}
        {flipped && (
        <div
          className="bg-muted rounded-xl shadow-inner flex items-center justify-center min-w-[320px] min-h-[180px] cursor-pointer border-2 border-black cursor-pointer"
          style={{ width: 320, minHeight: 180, maxWidth: 320, maxHeight: 180 }}
          onClick={() => setFlipped(f => !f)}
          tabIndex={0}
        >
          <div className="text-lg font-semibold text-center px-4 break-words overflow-auto w-full h-full">
            {currentWord ? currentWord.definition : ""}
          </div>
        </div>
      )}
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
  )}