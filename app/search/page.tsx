"use client"

import { AppProvider } from "@/contexts/app-context"
import { MainLayout } from "@/components/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

function SearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Search Words</h1>
        <p className="text-muted-foreground">Look up new vocabulary</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search for a word..."
          className="pl-10"
        />
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Search className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-center text-muted-foreground">
            Search functionality coming soon
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Enter a word above to search
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Page() {
  return (
    <AppProvider>
      <MainLayout>
        <SearchPage />
      </MainLayout>
    </AppProvider>
  )
}
