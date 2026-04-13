"use client"

import { useState } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/app-context"
import { FolderHeader } from "@/components/folder-header"
import { WordBar } from "@/components/word-bar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Folder, Plus, ArrowLeft, Trash2 } from "lucide-react"

export function LibraryPage() {
  const searchParams = useSearchParams()
  const initialFolderId = searchParams.get("folder")
  
  const { folders, words, addFolder, deleteFolder, getWordsInFolder, addWordToFolder, isSystemFolder } = useApp()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(initialFolderId)
  const [createFolderOpen, setCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [selectWordsOpen, setSelectWordsOpen] = useState(false)
  const [newlyCreatedFolderId, setNewlyCreatedFolderId] = useState<string | null>(null)
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([])
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null)

  const selectedFolder = folders.find((f) => f.id === selectedFolderId)
  const wordsInFolder = selectedFolderId ? getWordsInFolder(selectedFolderId) : []
  const dictionaryWords = words

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    const folder = await addFolder(newFolderName.trim())
    setNewFolderName("")
    setCreateFolderOpen(false)
    setNewlyCreatedFolderId(folder.id)
    setSelectedWordIds([])
    setSelectWordsOpen(true)
  }

  const handleSelectWords = async () => {
    if (!newlyCreatedFolderId) return
    const wordsAlreadyInFolder = getWordsInFolder(newlyCreatedFolderId).map(w => w.id)
    const wordsToAdd = selectedWordIds.filter(id => !wordsAlreadyInFolder.includes(id))
    await addWordToFolder(wordsToAdd, newlyCreatedFolderId)
    setSelectWordsOpen(false)
    setNewlyCreatedFolderId(null)
    setSelectedWordIds([])
  }

  const handleWordToggle = (wordId: string, checked: boolean) => {
    if (checked) {
      setSelectedWordIds((prev) => [...prev, wordId])
    } else {
      setSelectedWordIds((prev) => prev.filter((id) => id !== wordId))
    }
  }

  const handleDeleteFolder = (folderId: string) => {
    setFolderToDelete(folderId)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (folderToDelete) {
      await deleteFolder(folderToDelete)
      if (selectedFolderId === folderToDelete) {
        setSelectedFolderId(null)
      }
    }
    setDeleteConfirmOpen(false)
    setFolderToDelete(null)
  }

  const handleAddWords = () => {
    if (!selectedFolderId) return
    setNewlyCreatedFolderId(selectedFolderId)
    setSelectedWordIds(wordsInFolder.map(w => w.id))
    setSelectWordsOpen(true)
  }

  return (
    <>
      {selectedFolderId && selectedFolder ? (
        <div className="space-y-6">
          <FolderHeader
            folderId={selectedFolder.id}
            folderName={selectedFolder.name}
            wordCount={wordsInFolder.length}
            onBack={() => setSelectedFolderId(null)}
            onAddWords={handleAddWords}
            onQuiz={() => {}}
            onFlashcards={() => {}}
            isSystemFolder={isSystemFolder(selectedFolder.id)}
          />

          {wordsInFolder.length > 0 ? (
            <div className="space-y-3">
              {wordsInFolder.map((word) => (
                <WordBar key={word.id} word={word} currentFolderId={selectedFolderId} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Folder className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-center text-muted-foreground">
                  This folder is empty
                </p>
                <p className="text-center text-sm text-muted-foreground">
                  Add words from other folders using the menu
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Library</h1>
            <p className="text-muted-foreground">Manage your word collections</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {folders.map((folder) => (
              <Card
                key={folder.id}
                className="group cursor-pointer transition-all hover:shadow-md hover:ring-2 hover:ring-primary/20"
              >
                <CardContent
                  className="flex items-center gap-4 p-4"
                  onClick={() => setSelectedFolderId(folder.id)}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Folder className="h-6 w-6 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{folder.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {getWordsInFolder(folder.id).length} words
                    </p>
                  </div>
                  {!isSystemFolder(folder.id) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteFolder(folder.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                      <span className="sr-only">Delete folder</span>
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            variant="outline"
            className="w-full gap-2 border-dashed"
            onClick={() => setCreateFolderOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Create a new Folder
          </Button>
        </div>
      )}

      {/* Create Folder Modal */}
      <Dialog open={createFolderOpen} onOpenChange={setCreateFolderOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setCreateFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder} disabled={!newFolderName.trim()}>
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Select Words Modal */}
      <Dialog open={selectWordsOpen} onOpenChange={setSelectWordsOpen}>
        <DialogContent className="max-h-[80vh] overflow-hidden sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Words to Folder</DialogTitle>
            <DialogDescription>
              Select words from your Dictionary to add to this folder
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[50vh] space-y-2 overflow-y-auto py-4">
            {dictionaryWords.map((word) => (
              <label
                key={word.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-accent"
              >
                <Checkbox
                  checked={selectedWordIds.includes(word.id)}
                  onCheckedChange={(checked: boolean | undefined) =>
                    handleWordToggle(word.id, !!checked)
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{word.word}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {word.phonetic}
                  </p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectWordsOpen(false)}>
              Skip
            </Button>
            <Button onClick={handleSelectWords}>
              Add {selectedWordIds.length > 0 ? `(${selectedWordIds.length})` : ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Folder?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the folder but the words will remain in your Dictionary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
