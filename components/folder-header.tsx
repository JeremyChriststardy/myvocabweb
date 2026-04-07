"use client"

import { useState, useRef, useEffect } from "react"
import { Plus, Brain, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Input } from "@/components/ui/input"
import { useApp } from "@/contexts/app-context"

interface FolderHeaderProps {
  folderId: string
  folderName: string
  wordCount: number
  onBack: () => void
  onAddWords: () => void
  onQuiz: () => void
  onFlashcards: () => void
  isSystemFolder?: boolean
}

export function FolderHeader({
  folderId,
  folderName,
  wordCount,
  onBack,
  onAddWords,
  onQuiz,
  onFlashcards,
  isSystemFolder = false,
}: FolderHeaderProps) {
  const { updateFolder } = useApp()
  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(folderName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setEditedName(folderName)
  }, [folderName])

  const handleStartEditing = () => {
    if (isSystemFolder) return
    setIsEditingName(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleSaveName = async () => {
    const trimmedName = editedName.trim()
    if (trimmedName && trimmedName !== folderName) {
      try {
        await updateFolder(folderId, trimmedName)
      } catch (error) {
        console.error("Failed to update folder name:", error)
        setEditedName(folderName) // Revert on error
      }
    } else {
      setEditedName(folderName) // Revert if empty or unchanged
    }
    setIsEditingName(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName()
    } else if (e.key === "Escape") {
      setEditedName(folderName)
      setIsEditingName(false)
    }
  }
  return (
    <div className="border-b border-border/40">
      <div className="py-8 px-6">
        <div className="flex items-center justify-between">
          {/* Left: Back Button + Title */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span className="sr-only">Back to folders</span>
            </Button>
            <div className="flex flex-col space-y-2">
              {isEditingName ? (
                <Input
                  ref={inputRef}
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={handleKeyDown}
                  className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl h-auto p-0 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  disabled={isSystemFolder}
                />
              ) : (
                <h1
                  className={`text-2xl font-bold tracking-tight text-foreground lg:text-3xl ${
                    !isSystemFolder ? "cursor-pointer hover:bg-muted/50 rounded px-1 -mx-1 transition-colors" : ""
                  }`}
                  onClick={handleStartEditing}
                >
                  {folderName}
                </h1>
              )}
              <p className="text-base text-muted-foreground">
                {wordCount} {wordCount === 1 ? "word" : "words"} in this collection
              </p>
            </div>
          </div>

          {/* Right: Action Toolbar */}
          <div className="flex gap-3">
            <ButtonGroup>
              {!isSystemFolder && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onAddWords}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Word</span>
                  <span className="sm:hidden">Add</span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={onQuiz}
                className="gap-2"
              >
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Quiz</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onFlashcards}
                className="gap-2"
              >
                <Layers className="h-4 w-4" />
                <span className="hidden sm:inline">Flashcards</span>
              </Button>
            </ButtonGroup>
          </div>
        </div>
      </div>
    </div>
  )
}
