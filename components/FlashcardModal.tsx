import { useEffect, useRef, useState } from "react"
import { X, ChevronLeft, ChevronRight, Check, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FlashcardModalProps {
  open: boolean
  onClose: () => void
}

export function FlashcardModal({ open, onClose }: FlashcardModalProps) {
  const [flipped, setFlipped] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        ref={modalRef}
        className={cn(
          "relative w-[350px] min-h-[220px] bg-card rounded-xl shadow-2xl flex flex-col items-center justify-center transition-transform duration-500",
          flipped ? "rotate-y-180" : ""
        )}
        tabIndex={-1}
      >
        <button
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
          onClick={onClose}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
        {/* Card Content */}
        <div className={cn("flex flex-col items-center justify-center w-full h-full", flipped ? "hidden" : "")}>
          <div className="text-lg font-semibold mb-6">Front of Card</div>
          <div className="flex gap-3 mt-8">
            <button className="rounded-full bg-muted p-2 hover:bg-accent" aria-label="Previous">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="rounded-full bg-green-100 text-green-700 p-2 hover:bg-green-200" aria-label="Mark Right">
              <Check className="w-5 h-5" />
            </button>
            <button className="rounded-full bg-red-100 text-red-700 p-2 hover:bg-red-200" aria-label="Mark Wrong">
              <XCircle className="w-5 h-5" />
            </button>
            <button className="rounded-full bg-muted p-2 hover:bg-accent" aria-label="Next">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className={cn("flex flex-col items-center justify-center w-full h-full", flipped ? "" : "hidden")}>
          <div className="text-lg font-semibold mb-6">Back of Card</div>
          {/* You can add more content here */}
        </div>
      </div>
    </div>
  )
}