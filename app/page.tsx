"use client"

import { AppProvider } from "@/contexts/app-context"
import { MainLayout } from "@/components/main-layout"
import { HomePage } from "@/components/home-page"

export default function Page() {
  return (
    <AppProvider>
      <MainLayout>
        <HomePage />
      </MainLayout>
    </AppProvider>
  )
}
