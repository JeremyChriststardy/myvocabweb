"use client"

import { Suspense } from "react"
import { AppProvider } from "@/contexts/app-context"
import { MainLayout } from "@/components/main-layout"
import { WordLearningPage } from "@/components/word-learning-page"

function WordContent() {
  return (
    <AppProvider>
      <MainLayout>
        <WordLearningPage />
      </MainLayout>
    </AppProvider>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <WordContent />
    </Suspense>
  )
}
