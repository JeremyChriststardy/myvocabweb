"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useApp, type Word, type WordStatus } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MoreVertical, Check, X, FolderPlus } from "lucide-react"

const statusColors: Record<WordStatus, string> = {
  New: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Learning: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Mastered: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  Forgotten: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
}

interface WordBarProps {
  word: Word
  currentFolderId?: string
}

export function WordBar({ word, currentFolderId }: WordBarProps) {
  const { folders, updateWordStatus, addWordToFolder, removeWordFromFolder, isSystemFolder } = useApp()
  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [selectedFolders, setSelectedFolders] = useState<string[]>(word.folderIds)

  // Status Logic
  const canMarkMastered = word.status === "Learning" || word.status === "Forgotten"
  const canMarkForgotten = word.status === "Mastered"

  const handleFolderToggle = (folderId: string, checked: boolean) => {
    if (checked) {
      setSelectedFolders((prev) => [...prev, folderId])
    } else {
      setSelectedFolders((prev) => prev.filter((id) => id !== folderId))
    }
  }

  const saveFolderSelection = async () => {
    await Promise.all(selectedFolders.map(async (folderId) => {
      if (!word.folderIds.includes(folderId)) {
        await addWordToFolder([word.id], folderId)
      }
    }))
    word.folderIds.forEach((folderId) => {
      if (!selectedFolders.includes(folderId)) {
        removeWordFromFolder(word.id, folderId)
      }
    })
    setFolderModalOpen(false)
  }

  return (
    <>
      <div className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 transition-all hover:shadow-md">
        {/* Image */}
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted flex items-center justify-center">
          {word.displayUrl ? (
            <Image
              src={word.displayUrl}
              alt={word.word || "Word image"}
              fill
              className="object-cover"
            />
          ) : (
            <span className="text-xs text-muted-foreground">No Image</span>
          )}
        </div>

        {/* Word and Phonetic */}
        
        <Link
          href={`/word/${word.id}${currentFolderId ? `?from=${currentFolderId}` : ""}`}
          className="min-w-0 flex-1 group" // Added 'group' for hover effects
        >
          <div className="flex items-baseline gap-2 overflow-hidden">
            <p className="truncate font-medium text-foreground transition-colors group-hover:text-primary capitalize">
              {word.word}
            </p>
            {word.part_of_speech && (
              <span className="text-xs italic text-muted-foreground/70 shrink-0">
                ({word.part_of_speech.toLowerCase()})
              </span>
            )}
          </div>
          
          {word.phonetic && (
            <p className="truncate text-sm text-muted-foreground">
              {word.phonetic}
            </p>
          )}
        </Link>

        {/* Status */}
        <span
          className={cn(
            "shrink-0 rounded-full px-3 py-1 text-xs font-medium",
            statusColors[word.status]
          )}
        >
          {word.status}
        </span>

        {/* Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {canMarkMastered && (
              <DropdownMenuItem onClick={() => updateWordStatus(word.id, "Mastered")}>
                <Check className="mr-2 h-4 w-4 text-green-600" />
                Mark as Mastered
              </DropdownMenuItem>
            )}
            {canMarkForgotten && (
              <DropdownMenuItem onClick={() => updateWordStatus(word.id, "Forgotten")}>
                <X className="mr-2 h-4 w-4 text-red-600" />
                Mark as Forgotten
              </DropdownMenuItem>
            )}
            {(canMarkMastered || canMarkForgotten) && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={() => setFolderModalOpen(true)}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Manage Folders
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Folder Selection Modal */}
      <Dialog open={folderModalOpen} onOpenChange={setFolderModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add to Folders</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {folders.filter(f => !isSystemFolder(f.id)).map((folder) => (
              <label
                key={folder.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
              >
                <Checkbox
                  checked={selectedFolders.includes(folder.id)}
                  onCheckedChange={(checked) =>
                    handleFolderToggle(folder.id, checked as boolean)
                  }
                />
                <span className="font-medium">{folder.name}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setFolderModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveFolderSelection}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}