import { useEffect, useRef, useState } from "react"
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/app-context"

interface FlashcardModalProps {
  open: boolean
  onClose: () => void
  folderId?: string | null
}

function PieChart({
  got,
  missed,
  skipped,
}: {
  got: number
  missed: number
  skipped: number
}) {
  const total = got + missed + skipped || 1

  const getSlice = (
    start: number,
    value: number,
    fill: string
  ) => {
    const angle = (value / total) * 360
    const r = 40
    const cx = 50
    const cy = 50

    const rad = (deg: number) => (Math.PI / 180) * deg
    const x1 = cx + r * Math.cos(rad(start))
    const y1 = cy + r * Math.sin(rad(start))
    const x2 = cx + r * Math.cos(rad(start + angle))
    const y2 = cy + r * Math.sin(rad(start + angle))

    const largeArc = angle > 180 ? 1 : 0

    return (
      <path
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={fill}
      />
    )
  }

  let start = 0
  const gotSlice = getSlice(start, got, "#22c55e")
  start += (got / total) * 360

  const missedSlice = getSlice(start, missed, "#ef4444")
  start += (missed / total) * 360

  const skippedSlice = getSlice(start, skipped, "#a3a3a3")

  return (
    <svg width={100} height={100} viewBox="0 0 100 100">
      {gotSlice}
      {missedSlice}
      {skippedSlice}
    </svg>
  )
}

export function FlashcardModal({
  open,
  onClose,
  folderId,
}: FlashcardModalProps) {
  const { getWordsInFolder } = useApp()
  const modalRef = useRef<HTMLDivElement>(null)

  const [flipped, setFlipped] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  const [correctCount, setCorrectCount] = useState(0)
  const [incorrectCount, setIncorrectCount] = useState(0)

  const [showStats, setShowStats] = useState(false)
  const [showMasteredPrompt, setShowMasteredPrompt] = useState(true)
  const [includeMastered, setIncludeMastered] = useState(false)

  const [startTime, setStartTime] = useState<number | null>(null)
  const [endTime, setEndTime] = useState<number | null>(null)

  const allWords = folderId ? getWordsInFolder(folderId) : []

  const words = includeMastered
    ? allWords
    : allWords.filter((w) => w.status !== "Mastered")

  const total = words.length

  const skippedCount =
    total - correctCount - incorrectCount

  const currentWord = words[currentIndex]

  useEffect(() => {
    if (!open) return

    setFlipped(false)
    setCurrentIndex(0)
    setCorrectCount(0)
    setIncorrectCount(0)
    setShowStats(false)
    setShowMasteredPrompt(true)

    setStartTime(Date.now())
    setEndTime(null)
  }, [open, folderId])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && !e.repeat) {
        e.preventDefault()
        setFlipped((v) => !v)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () =>
      window.removeEventListener("keydown", onKeyDown)
  }, [open])

  const handleFinish = () => {
    setEndTime(Date.now())
    setShowStats(true)
  }

  const goNext = () => {
    if (currentIndex === total - 1) {
      handleFinish()
      return
    }

    setCurrentIndex((i) => i + 1)
    setFlipped(false)
  }

  const goPrev = () => {
    if (currentIndex === 0) return

    setCurrentIndex((i) => i - 1)
    setFlipped(false)
  }

  const markCorrect = () => {
    setCorrectCount((v) => v + 1)
    goNext()
  }

  const markIncorrect = () => {
    setIncorrectCount((v) => v + 1)
    goNext()
  }

  if (!open || !folderId) return null

  if (showMasteredPrompt) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-card rounded-2xl shadow-2xl p-8 min-w-[360px]">
          <label className="flex gap-3 items-center text-lg mb-6">
            <input
              type="checkbox"
              checked={includeMastered}
              onChange={(e) =>
                setIncludeMastered(e.target.checked)
              }
            />
            Include mastered cards?
          </label>

          <button
            className="rounded bg-primary text-primary-foreground px-6 py-2 w-full"
            onClick={() =>
              setShowMasteredPrompt(false)
            }
          >
            Start Flashcards
          </button>
        </div>
      </div>
    )
  }

  if (showStats) {
    const answered =
      correctCount + incorrectCount + skippedCount

    const percent = answered
      ? Math.round(
          (correctCount / answered) * 100
        )
      : 0

    const time =
      startTime && endTime
        ? ((endTime - startTime) / 1000).toFixed(1)
        : "0"

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-card rounded-2xl shadow-2xl p-8 min-w-[420px]">
          <div className="flex gap-8 items-center">
            <PieChart
              got={correctCount}
              missed={incorrectCount}
              skipped={skippedCount}
            />

            <div className="space-y-2">
              <div>Correct: {correctCount}</div>
              <div>Wrong: {incorrectCount}</div>
              <div>Skipped: {skippedCount}</div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <div className="text-2xl font-bold">
              {percent}% Correct
            </div>
            <div className="text-sm">
              {time}s
            </div>
          </div>

          <button
            onClick={onClose}
            className="mt-6 rounded bg-primary text-primary-foreground px-6 py-2 w-full"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        ref={modalRef}
        className="relative bg-card rounded-2xl shadow-2xl px-8 py-8 min-w-[420px] min-h-[420px]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4"
        >
          <X />
        </button>

        <div className="absolute top-4 left-4 text-sm">
          {currentIndex + 1} / {total}
        </div>

        {currentIndex > 0 && (
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2"
          >
            <ChevronLeft />
          </button>
        )}

        <button
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        >
          <ChevronRight />
        </button>

        <div className="flex justify-center items-center mt-16">
          <div
            className="relative w-[320px] h-[180px] cursor-pointer [perspective:1000px]"
            onClick={() =>
              setFlipped((v) => !v)
            }
          >
            <div
              className={cn(
                "relative w-full h-full duration-700 [transform-style:preserve-3d]",
                flipped &&
                  "[transform:rotateY(180deg)]"
              )}
            >
              <div className="absolute inset-0 bg-background rounded-xl border shadow flex items-center justify-center [backface-visibility:hidden]">
                {currentWord?.word}
              </div>

              <div className="absolute inset-0 bg-muted rounded-xl border shadow flex items-center justify-center px-4 text-center [transform:rotateY(180deg)] [backface-visibility:hidden]">
                {currentWord?.definition}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-6 mt-8">
          <button
            onClick={markCorrect}
            className="px-6 py-2 rounded-full bg-green-100 text-green-700 flex gap-2"
          >
            <Check />
            {correctCount}
          </button>

          <button
            onClick={markIncorrect}
            className="px-6 py-2 rounded-full bg-red-100 text-red-700 flex gap-2"
          >
            <XCircle />
            {incorrectCount}
          </button>
        </div>
      </div>
    </div>
  )
}