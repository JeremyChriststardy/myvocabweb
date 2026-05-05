"use client"

import { useEffect, useRef, useState } from "react"
import {X,
  ChevronLeft,
  ChevronRight,
  Check,
  XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/app-context"

const play = (ref: React.RefObject<HTMLAudioElement | null>) => {
  if (!ref.current) return
  ref.current.currentTime = 0
  ref.current.play().catch(() => {})
}

interface FlashcardModalProps {
  open: boolean
  onClose: () => void
  folderId?: string | null
}

function PieChart({ got, missed, skipped }: { got: number; missed: number; skipped: number }) {
  const total = got + missed + skipped || 1

  const radius = 40
  const circumference = 2 * Math.PI * radius

  const getOffset = (value: number) =>
    circumference - (value / total) * circumference

  return (
    <svg width={240} height={240} viewBox="0 0 100 100">
      <g transform="rotate(-90 50 50)">
        {/* GREEN */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#22c55e"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={getOffset(got)}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />

        {/* RED */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#ef4444"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={getOffset(got + missed)}
          style={{ transition: "stroke-dashoffset 1.4s ease" }}
        />

        {/* GREY */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="#a3a3a3"
          strokeWidth="10"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={0}
          style={{ transition: "stroke-dashoffset 1.8s ease" }}
        />
      </g>
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
  const [confetti, setConfetti] = useState(false)

  const [startTime, setStartTime] = useState<number | null>(null)
  const [endTime, setEndTime] = useState<number | null>(null)

  const allWords = folderId ? getWordsInFolder(folderId) : []

   // ✅ audio refs MUST be inside component
  const correctSound = useRef<HTMLAudioElement | null>(null)
  const wrongSound = useRef<HTMLAudioElement | null>(null)
  const winSound = useRef<HTMLAudioElement | null>(null)

  // ✅ init once
  useEffect(() => {
    correctSound.current = new Audio("/sounds/ding.mp3")
    wrongSound.current = new Audio("/sounds/buzz.mp3")
    winSound.current = new Audio("/sounds/victory.mp3")
  }, [])

  // ✅ helper stays inside
  const play = (ref: React.RefObject<HTMLAudioElement | null>) => {
    if (!ref.current) return
    ref.current.currentTime = 0
    ref.current.play().catch(() => {})
  }

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
    play(winSound)
    setConfetti(true)

    setTimeout(() => {
    setConfetti(false)}, 2000)
  }
  const restartSession = () => {
  setFlipped(false)
  setCurrentIndex(0)
  setCorrectCount(0)
  setIncorrectCount(0)
  setShowStats(false)
  setConfetti(false)

  setStartTime(Date.now())
  setEndTime(null)
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
    play(correctSound)
    setCorrectCount((v) => v + 1)
    goNext()
  }

  const markIncorrect = () => {
    play(wrongSound)
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
    ? Math.round((correctCount / answered) * 100)
    : 0

  const time =
    startTime && endTime
      ? ((endTime - startTime) / 1000).toFixed(1)
      : "0"

  const renderConfetti = () => {
  if (!confetti) return null

  const colors = ["#22c55e", "#ef4444", "#3b82f6", "#facc15", "#a855f7"]

  return (
    <div className="fixed inset-0 pointer-events-none z-[999] overflow-hidden">
      {Array.from({ length: 80 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-6 rounded-sm"
          style={{
            left: `${Math.random() * 100}%`,
            top: "-10px",
            background: colors[i % colors.length],
            animation: `confettiFall 2s linear forwards`,
            animationDelay: `${Math.random()}s`,
          }}
        />
      ))}
    </div>
  )
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      {renderConfetti()}
      <div className="relative bg-card rounded-2xl shadow-2xl px-10 py-8 w-[420px] min-h-[420px] overflow-hidden">
        

        <div className="grid items-center justify-between gap-8 h-full">
          {/* LEFT */}
          <div className="relative flex items-center justify-center">
            <PieChart
              got={correctCount}
              missed={incorrectCount}
              skipped={skippedCount}
            />

            <div className="absolute w-28 h-28 rounded-full bg-white shadow-lg flex flex-col items-center justify-center text-black">
              <div className="text-3xl font-bold">
                {correctCount}/{total}
              </div>

              <div className="text-sm font-medium mt-1">
                {percent}% correct
              </div>

              <div className="text-xs text-gray-500 mt-1">
                {time}s
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex flex-col justify-between h-full w-[140px]">
            <div className="flex flex-col gap-3 mt-6">
              <div className="flex justify-between">
                <span className="text-green-600 font-bold">Got it</span>
                <span>{correctCount}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-red-600 font-bold">Missed</span>
                <span>{incorrectCount}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600 font-bold">Skipped</span>
                <span>{skippedCount}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-6">
              <button
                onClick={restartSession}
                className="rounded bg-muted px-6 py-2 font-semibold hover:bg-accent"
              >
                Restart
              </button>

              <button
                onClick={onClose}
                className="rounded bg-primary text-primary-foreground px-6 py-2 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
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