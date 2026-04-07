"use client"

import { Suspense } from "react"
import { AppProvider } from "@/contexts/app-context"
import { MainLayout } from "@/components/main-layout"
import { LibraryPage } from "@/components/library-page"

function LibraryContent() {
  return (
    <AppProvider>
      <MainLayout>
        <LibraryPage />
      </MainLayout>
    </AppProvider>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LibraryContent />
    </Suspense>
  )
}
