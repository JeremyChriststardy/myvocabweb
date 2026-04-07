"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useApp, type WordStatus } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Volume2, BookOpen, Sparkles, RotateCw, SlidersHorizontal } from "lucide-react"

const statusColors: Record<WordStatus, string> = {
  New: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  Learning: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800",
  Mastered: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  Forgotten: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
}

const statusButtonVariants: Record<WordStatus, string> = {
  New: "hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-400",
  Learning: "hover:bg-green-100 hover:text-green-700 dark:hover:bg-green-900/30 dark:hover:text-green-400",
  Mastered: "hover:bg-purple-100 hover:text-purple-700 dark:hover:bg-purple-900/30 dark:hover:text-purple-400",
  Forgotten: "hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400",
}

// --- Internal Component for Cycling Dots ---
const LoadingDots = () => {
  const [dots, setDots] = useState(".")
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "." : prev + "."))
    }, 500)
    return () => clearInterval(interval)
  }, [])
  return <span className="inline-block w-8">{dots}</span>
}

// --- Settings Popover Component ---
function SettingsPopover({ genre, setGenre, vibe, setVibe, complexity, setComplexity, length, setLength }: {
  genre: string
  setGenre: (value: string) => void
  vibe: number
  setVibe: (value: number) => void
  complexity: number
  setComplexity: (value: number) => void
  length: string
  setLength: (value: string) => void
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-full">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Customize
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 rounded-2xl border-muted bg-card p-6 shadow-lg">
        <div className="space-y-6">
          {/* Genre Select */}
          <div className="space-y-2">
            <Label htmlFor="genre" className="text-sm font-medium text-foreground">
              Genre
            </Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger id="genre" className="rounded-lg border-muted/50 bg-muted/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="slice-of-life">Slice-of-Life</SelectItem>
                <SelectItem value="fantasy">Fantasy</SelectItem>
                <SelectItem value="mystery">Mystery</SelectItem>
                <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                <SelectItem value="travel">Travel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Vibe Slider */}
          <div className="space-y-3">
            <Label htmlFor="vibe" className="text-sm font-medium text-foreground">
              Vibe
            </Label>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Whimsical</span>
              <Slider
                id="vibe"
                min={0}
                max={100}
                step={1}
                value={[vibe]}
                onValueChange={(val) => setVibe(val[0])}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">Dark</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">{vibe}% dark</p>
          </div>

          {/* Complexity Slider */}
          <div className="space-y-3">
            <Label htmlFor="complexity" className="text-sm font-medium text-foreground">
              Complexity
            </Label>
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs text-muted-foreground">Simple</span>
              <Slider
                id="complexity"
                min={0}
                max={100}
                step={1}
                value={[complexity]}
                onValueChange={(val) => setComplexity(val[0])}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">Academic</span>
            </div>
            <p className="text-xs text-muted-foreground text-center">{complexity}% academic</p>
          </div>

          {/* Length Tabs */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Length</Label>
            <Tabs value={length} onValueChange={setLength} className="w-full">
              <TabsList className="grid w-full grid-cols-3 rounded-lg bg-muted/50">
                <TabsTrigger value="short" className="rounded-md">
                  Short
                </TabsTrigger>
                <TabsTrigger value="medium" className="rounded-md">
                  Medium
                </TabsTrigger>
                <TabsTrigger value="epic" className="rounded-md">
                  Epic
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function WordLearningPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const wordId = params.id as string
  const fromFolder = searchParams.get("from")
  
  const { words, updateWordStatus, getStory } = useApp() // Assumes getStory is in context
  const word = words.find((w) => w.id === wordId)

  // --- Local State for Story ---
  const [story, setStory] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)

  // --- Customization State ---
  const [genre, setGenre] = useState("slice-of-life")
  const [vibe, setVibe] = useState(50)
  const [complexity, setComplexity] = useState(50)
  const [length, setLength] = useState("short")

  const handleFetchStory = useCallback(async (force = false) => {
    if (!word) return
    setIsGenerating(true)
    const result = await getStory(word, force, { genre, vibe, complexity, length })
    setStory(result)
    setIsGenerating(false)
    console.log("Phase 4: Story received in UI:", result); // LOG THIS
  }, [word, getStory, genre, vibe, complexity, length])

  // Auto-change status and load initial story
  useEffect(() => {
    if (word) {
      if (word.status === "New") {
        updateWordStatus(word.id, "Learning")
      }
      handleFetchStory() // Load story on mount
    }
  }, [word?.id, updateWordStatus, handleFetchStory])

  if (!word) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-lg text-muted-foreground">Word not found</p>
        <Link href="/library">
          <Button variant="link">Go back to Library</Button>
        </Link>
      </div>
    )
  }

  const backUrl = fromFolder ? `/library?folder=${fromFolder}` : "/library"
  const statuses: WordStatus[] = ["New", "Learning", "Mastered", "Forgotten"]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href={backUrl}>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
              <span className="sr-only">Back</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              <span className="capitalize">{word.word}</span>
              <span className="ml-2 text-lg font-normal italic text-muted-foreground">
                ({word.part_of_speech?.toLowerCase()})
              </span>
            </h1>
            <p className="flex items-center gap-2 text-lg text-muted-foreground">
              {word.phonetic}
              <button
                className="rounded-full p-1 hover:bg-accent"
                aria-label="Play pronunciation"
              >
                <Volume2 className="h-4 w-4" />
              </button>
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Image and Definition */}
          <Card>
            <CardContent className="flex flex-col gap-6 p-6 sm:flex-row">
              <div className="relative h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-muted sm:h-48 sm:w-48 border border-border/50 shadow-sm">
                <Image
                  src={word.displayUrl || "/placeholder.svg"} 
                  alt={word.word}
                  fill
                  className="object-cover"
                  unoptimized={!!word.displayUrl}
                />
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    Definition
                  </div>
                  <p className="text-lg text-foreground">{word.definition}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Story */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                AI-Generated Story
              </CardTitle>
              <SettingsPopover genre={genre} setGenre={setGenre} vibe={vibe} setVibe={setVibe} complexity={complexity} setComplexity={setComplexity} length={length} setLength={setLength} />
            </CardHeader>
            <CardContent>
              {isGenerating ? (
                <p className="text-lg font-medium text-muted-foreground italic py-4">
                  Writing a story for you<LoadingDots />
                </p>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none animate-in fade-in duration-700">
                  {story ? (
                    story.split("\n\n").map((paragraph, index) => (
                      <p key={index} className="text-foreground leading-relaxed">
                        {paragraph}
                      </p>
                    ))
                  ) : (
                    <p className="text-muted-foreground italic">No story generated yet.</p>
                  )}
                </div>
              )}
              {!isGenerating && story && (
                <div className="flex justify-end mt-4">
                  <Button 
                    variant="ghost"
                    onClick={() => handleFetchStory(true)}
                    className="text-sm"
                  >
                    <RotateCw className="mr-2 h-4 w-4" />
                    Generate a new story
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Current Status</CardTitle>
            </CardHeader>
            <CardContent>
              <span
                className={cn(
                  "inline-flex rounded-full border px-4 py-2 text-sm font-medium",
                  statusColors[word.status]
                )}
              >
                {word.status}
              </span>
            </CardContent>
          </Card>

          {/* Change Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Change Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {statuses.map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  className={cn(
                    "w-full justify-start",
                    word.status === status && statusColors[status],
                    word.status !== status && statusButtonVariants[status]
                  )}
                  onClick={() => updateWordStatus(word.id, status)}
                >
                  {status}
                  {word.status === status && (
                    <span className="ml-auto text-xs">(Current)</span>
                  )}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
