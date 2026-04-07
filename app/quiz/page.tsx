"use client"

import { AppProvider } from "@/contexts/app-context"
import { MainLayout } from "@/components/main-layout"
import { Card, CardContent } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"

function QuizPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Quiz</h1>
        <p className="text-muted-foreground">Test your vocabulary knowledge</p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <HelpCircle className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="text-center text-muted-foreground">
            Quiz functionality coming soon
          </p>
          <p className="text-center text-sm text-muted-foreground">
            Practice with your saved words
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
        <QuizPage />
      </MainLayout>
    </AppProvider>
  )
}
