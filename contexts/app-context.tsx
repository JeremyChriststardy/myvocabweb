"use client"
import { supabase } from "@/lib/supabase"
import { createContext, useContext, useState, useCallback, type ReactNode, useEffect, useRef } from "react"

export type WordStatus = "New" | "Learning" | "Mastered" | "Forgotten"

export interface User {
  id: string 
  email: string
  username: string
  streakDays: number
  wordsToday: number
  statusCounts: {
    New: number
    Learning: number
    Mastered: number
    Forgotten: number
  }
  totalWordsSaved: number
}

export interface Word {
  id: string
  word: string
  phonetic: string
  definition: string
  image_path: string
  displayUrl?: string;
  status: WordStatus
  folderIds: string[]
  createdAt: Date
  part_of_speech: string
}

export interface Folder {
  id: string
  name: string
  isDeletable: boolean
  createdAt: Date
}

export type AuthResult = {
  success: boolean
  error?: string
}

interface AppContextType {
  words: Word[]
  folders: Folder[]
  sidebarCollapsed: boolean
  darkMode: boolean
  user: User | null
  isLoading: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  setDarkMode: (dark: boolean) => void
  login: (email: string, password: string) => Promise<AuthResult>
  signup: (username: string, email: string, password: string) => Promise<AuthResult>
  logout: () => void
  addFolder: (name: string) => Promise<Folder>
  updateFolder: (id: string, name: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  updateWordStatus: (wordId: string, status: WordStatus) => void
  addWordToFolder: (wordIds: string[], folderId: string) => Promise<void>
  removeWordFromFolder: (wordId: string, folderId: string) => void
  getWordsInFolder: (folderId: string) => Word[]
  getRecentWords: () => Word[]
  getRecentFolders: () => Folder[]
  getStory: (word: Word, forceNew?: boolean, options?: { genre: string; vibe: number; complexity: number; length: string }) => Promise<string>;
  isSystemFolder: (folderId: string) => boolean
}

const initialFolders: Folder[] = [
  {
    id: "dictionary",
    name: "Dictionary",
    isDeletable: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
  },
]

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [words, setWords] = useState<Word[]>([])
  const [folders, setFolders] = useState<Folder[]>(initialFolders)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [storyCache, setStoryCache] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)

  const fetchingRef = useRef(false)

  // ------------------ STORY ------------------
  const getStory = useCallback(async (wordObj: Word, forceNew: boolean = false, options?: { genre: string; vibe: number; complexity: number; length: string }) => {
    if (!forceNew && storyCache[wordObj.id]) {
      return storyCache[wordObj.id]
    }

    try {
      const res = await fetch("/api/generate-story", {
        method: "POST",
        body: JSON.stringify({
          word: wordObj.word,
          part_of_speech: wordObj.part_of_speech,
          definition: wordObj.definition,
          genre: options?.genre,
          vibe: options?.vibe,
          complexity: options?.complexity,
          length: options?.length
        }),
      })

      const { story } = await res.json()
      setStoryCache(prev => ({ ...prev, [wordObj.id]: story }))
      return story
    } catch {
      return "Could not generate a story at this time."
    }
  }, [storyCache])

  // ------------------ WORDS ------------------
  const fetchUserWords = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("user_vocabs")
      .select(`
        id,
        status,
        created_at,
        image_path,
        phonetic,
        dictionary_entries (
          word,
          definition,
          part_of_speech
        ),
        folder_words (
          folder_id
        )
      `)
      .eq("user_id", userId)

    if (error) return

    const formattedWords: Word[] = (data || []).map((v: any) => {
      const entry = v.dictionary_entries

      const finalDisplayUrl = v.image_path 
        ? supabase.storage.from('captures').getPublicUrl(v.image_path).data.publicUrl
        : "/placeholder.svg?height=60&width=60"
      // 1. Get IDs from the folder_words join table
      const joinedFolderIds = v.folder_words?.map((fw: any) => fw.folder_id) || []

      // 2. Combine with "dictionary" to ensure every word stays in the main list.
      // We use a Set to prevent duplicate IDs if "dictionary" is already in the DB.
      const uniqueFolderIds = Array.from(new Set(["dictionary", ...joinedFolderIds]))
      return {
        id: v.id,
        word: entry?.word || "Unknown Word",
        phonetic: v.phonetic || "",
        definition: entry?.definition || "No definition available",
        image_path: v.image_path || "",
        displayUrl: finalDisplayUrl,
        status: v.status as WordStatus,
        folderIds: v.folder_words ? v.folder_words.map((fw: any) => fw.folder_id) : ["dictionary"],
        createdAt: new Date(v.created_at),
        part_of_speech: entry?.part_of_speech || "Noun",
      }
    })

    setWords(formattedWords)
  }, [])

  // ------------------ STATS ------------------
  const fetchUserStats = useCallback(async (authUser: any) => {
    if (!authUser) return

    try {
      const [profileResult, totalWordsResult, wordsTodayResult, statusResult] = await Promise.all([
        supabase.from("profiles").select("username, streak_days, last_active_date").eq("id", authUser.id).single(),
        supabase.from("user_vocabs").select("*", { count: "exact" }).eq("user_id", authUser.id),
        supabase.from("user_vocabs")
          .select("*", { count: "exact" })
          .eq("user_id", authUser.id)
          .gte("updated_at", new Date(new Date().setHours(0,0,0,0)).toISOString()),
        supabase.rpc("get_status_counts", { uid: authUser.id })
      ])

      const profileData = profileResult.data

      let newStreak = 1
      if (profileData?.last_active_date) {
        const lastActive = new Date(profileData.last_active_date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const diffDays = Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24))

        if (diffDays === 1) newStreak = (profileData.streak_days ?? 0) + 1
        else if (diffDays === 0) newStreak = profileData.streak_days ?? 0
      }

      const statusData = statusResult.data

      setUser({
        id: authUser.id,
        email: authUser.email || "",
        username: profileData?.username || "No username",
        streakDays: newStreak,
        wordsToday: wordsTodayResult.count ?? 0,
        totalWordsSaved: totalWordsResult.count ?? 0,
        statusCounts: {
          New: statusData?.find((s: any) => s.status === "New")?.count ?? 0,
          Learning: statusData?.find((s: any) => s.status === "Learning")?.count ?? 0,
          Mastered: statusData?.find((s: any) => s.status === "Mastered")?.count ?? 0,
          Forgotten: statusData?.find((s: any) => s.status === "Forgotten")?.count ?? 0,
        },
      })

      // Fetch user folders
      const { data: foldersData, error: foldersError } = await supabase
        .from("user_folders")
        .select("id, name, is_deletable, created_at")
        .eq("user_id", authUser.id)
        .order('created_at', { ascending: true }) // Hero tip: Keep them in order!

      if (!foldersError && foldersData) {
        interface FolderDB {
          id: string;
          name: string;
          is_deletable: boolean;
          created_at: string;
        }

        const mappedFolders: Folder[] = (foldersData as FolderDB[]).map((f: FolderDB) => ({
          id: f.id,
          name: f.name,
          isDeletable: f.is_deletable, // Note: f.is_deletable is snake_case from DB
          createdAt: new Date(f.created_at)
        }))
        
        // 🔥 Only use mappedFolders. The SQL trigger handles the "Dictionary" folder creation.
        setFolders(mappedFolders) 
      }

      // 🔥 DO NOT BLOCK UI
      fetchUserWords(authUser.id)

    } catch (error) {
      console.error(error)
    }
  }, [])

  // ------------------ AUTH ------------------
  const handleAuth = useCallback(async (session: any) => {
    if (fetchingRef.current) return
    fetchingRef.current = true

    try {
      if (session?.user) {
        setIsLoading(false) // 🔥 UNBLOCK UI IMMEDIATELY
        fetchUserStats(session.user)
      } else {
        setUser(null)
        setWords([])
        setIsLoading(false)
      }
    } finally {
      fetchingRef.current = false
    }
  }, [fetchUserStats])

  useEffect(() => {
  let mounted = true

  const init = async () => {
    // 1. Get the current session immediately
    const { data: { session } } = await supabase.auth.getSession()
    
    if (mounted) {
      if (session) {
        // If there's a session, we still "load" until stats are fetched
        await handleAuth(session)
      } else {
        // If no session, we aren't loading anymore (Middleware will redirect anyway)
        setIsLoading(false)
      }
    }
  }

  init()
  // ... rest of your listener
}, [handleAuth])

  // ------------------ AUTH ACTIONS ------------------
  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { success: false, error: error.message }
    if (data.user) fetchUserStats(data.user)
    return { success: true }
  }, [fetchUserStats])

  const signup = useCallback(async (username: string, email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return { success: false, error: error.message }

    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        username,
        email,
        created_at: new Date(),
      })
    }

    return { success: true }
  }, [])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [])

  // ------------------ WORD ACTIONS ------------------
  const updateWordStatus = useCallback(async (wordId: string, status: WordStatus) => {
    await supabase.from("user_vocabs").update({ status }).eq("id", wordId)

    setWords(prev =>
      prev.map(word => word.id === wordId ? { ...word, status } : word)
    )
  }, [])

  const addFolder = useCallback(async (name: string): Promise<Folder> => {
    if (!user) throw new Error("User not logged in")

    const { data, error } = await supabase
      .from("user_folders")
      .insert({
        name,
        user_id: user.id,
        is_deletable: true
      })
      .select()
      .single()

    if (error) throw error

    const newFolder: Folder = {
      id: data.id,
      name: data.name,
      isDeletable: data.is_deletable,
      createdAt: new Date(data.created_at)
    }

    setFolders(prev => [...prev, newFolder])
    return newFolder
  }, [user])

  const updateFolder = useCallback(async (id: string, name: string): Promise<void> => {
    if (!user) throw new Error("User not logged in")

    // Optimistic update
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))

    try {
      const { error } = await supabase
        .from("user_folders")
        .update({ name })
        .eq("id", id)

      if (error) throw error
    } catch (error) {
      // Revert on error
      setFolders(prev => prev.map(f => f.id === id ? { ...f, name: folders.find(fold => fold.id === id)?.name || f.name } : f))
      throw error
    }
  }, [user, folders])

  const deleteFolder = useCallback(async (id: string): Promise<void> => {
    // Safety check: ensure folder exists and is deletable
    const folderToDelete = folders.find(f => f.id === id);
    if (!folderToDelete || !folderToDelete.isDeletable) {
      console.error("Cannot delete folder: not found or not deletable");
      return;
    }

    // Capture current state for rollback
    const previousFolders = [...folders];
    const previousWords = words.map(w => ({ ...w, folderIds: [...w.folderIds] }));

    // Optimistic update: immediately update UI
    setFolders(prev => prev.filter(f => f.id !== id));
    setWords(prev =>
      prev.map(word => ({
        ...word,
        folderIds: word.folderIds.filter(fId => fId !== id),
      }))
    );

    // Background deletion
    try {
      const { error } = await supabase
        .from("user_folders")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("❌ Supabase Delete Error:", error instanceof Error ? error.message : error);
      // Rollback: revert to previous state
      setFolders(previousFolders);
      setWords(previousWords);
    }
  }, [folders, words])

  const addWordToFolder = useCallback(async (wordIds: string[], folderId: string): Promise<void> => {
    // Optimistic update: immediately add folderId to each word's folderIds
    setWords(prev =>
      prev.map(word =>
        wordIds.includes(word.id) && !word.folderIds.includes(folderId)
          ? { ...word, folderIds: [...word.folderIds, folderId] }
          : word
      )
    )

    try {
      const { error } = await supabase
        .from("folder_words")
        .insert(wordIds.map(wordId => ({
          word_id: wordId,
          folder_id: folderId
        })))

      if (error) throw error
    } catch (error) {
      console.error("Error adding words to folder:", error)
      // Rollback: remove folderId from those words
      setWords(prev =>
        prev.map(word =>
          wordIds.includes(word.id)
            ? { ...word, folderIds: word.folderIds.filter(id => id !== folderId) }
            : word
        )
      )
      throw error
    }
  }, [])

  const removeWordFromFolder = useCallback((wordId: string, folderId: string) => {
    setWords(prev =>
      prev.map(word =>
        word.id === wordId
          ? { ...word, folderIds: word.folderIds.filter(id => id !== folderId) }
          : word
      )
    )
  }, [])

  const getWordsInFolder = useCallback((folderId: string) => {
    return words.filter(word => word.folderIds.includes(folderId))
  }, [words])

  const getRecentWords = useCallback(() => {
    const t = Date.now() - 1000 * 60 * 60 * 24
    return words.filter(w => w.createdAt.getTime() > t)
  }, [words])

  const getRecentFolders = useCallback(() => {
    return folders.slice().sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5)
  }, [folders])

  const isSystemFolder = useCallback((folderId: string) => {
    const folder = folders.find(f => f.id === folderId)
    return folderId === "dictionary" || folder?.name === "Dictionary"
  }, [folders])

  return (
    <AppContext.Provider
      value={{
        words,
        folders,
        sidebarCollapsed,
        darkMode,
        user,
        isLoading,
        setSidebarCollapsed,
        setDarkMode,
        login,
        signup,
        logout,
        addFolder,
        updateFolder,
        deleteFolder,
        updateWordStatus,
        addWordToFolder,
        removeWordFromFolder,
        getWordsInFolder,
        getRecentWords,
        getRecentFolders,
        getStory,
        isSystemFolder,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}