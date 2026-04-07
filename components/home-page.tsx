"use client"

import Link from "next/link"
import { useApp } from "@/contexts/app-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Library, HelpCircle, Clock, Folder, Trophy } from "lucide-react"

export function HomePage() {
  const { getRecentWords, getRecentFolders } = useApp()
  const recentWords = getRecentWords()
  const recentFolders = getRecentFolders()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back</h1>
        <p className="text-muted-foreground">Continue your vocabulary journey</p>
      </div>

      {/* Recent Words */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Recent Words</h2>
        </div>
        {recentWords.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentWords.slice(0, 6).map((word) => (
              <Card key={word.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <p className="font-medium text-foreground">{word.word}</p>
                  <p className="text-sm text-muted-foreground">{word.phonetic}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Clock className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-center text-muted-foreground">
                No words from the last 24 hours
              </p>
              <p className="text-center text-sm text-muted-foreground">
                Start searching to add new words
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Recent Folders */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Folder className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Recent Folders</h2>
        </div>
        {recentFolders.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentFolders.map((folder) => (
              <Link key={folder.id} href={`/library?folder=${folder.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <Folder className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <p className="font-medium text-foreground">{folder.name}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Folder className="mb-2 h-8 w-8 text-muted-foreground/50" />
              <p className="text-center text-muted-foreground">
                No folders yet
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Recent Achievements */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground">Recent Achievements</h2>
        </div>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Trophy className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-center text-muted-foreground">
              No achievements yet
            </p>
            <p className="text-center text-sm text-muted-foreground">
              Complete quizzes to earn achievements
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-foreground">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/search">
            <Card className="group cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-primary/20">
              <CardHeader className="pb-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Search className="h-7 w-7 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">Search Words</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Look up new vocabulary
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/library">
            <Card className="group cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-primary/20">
              <CardHeader className="pb-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Library className="h-7 w-7 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">Library</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Manage your word collections
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/quiz">
            <Card className="group cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-primary/20">
              <CardHeader className="pb-2">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <HelpCircle className="h-7 w-7 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-lg">Quiz</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  Test your knowledge
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  )
}
