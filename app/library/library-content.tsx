"use client"

import { AppProvider } from "@/contexts/app-context"
import { MainLayout } from "@/components/main-layout"
import { LibraryPage } from "@/components/library-page"

// This component will ONLY run on the client side
export default function LibraryContent() {
  return (
    <AppProvider>
      <MainLayout>
        <LibraryPage />
      </MainLayout>
    </AppProvider>
  )
}