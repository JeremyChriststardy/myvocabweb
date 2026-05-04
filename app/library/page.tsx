"use client"

import { AppProvider } from "@/contexts/app-context"
import { MainLayout } from "@/components/main-layout"
import { LibraryPage } from "@/components/library-page"
import { useEffect, useState } from "react"

export default function Page() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }

  return (
    <AppProvider>
      <MainLayout>
        <LibraryPage />
      </MainLayout>
    </AppProvider>
  )
}
//*/

/*
"use client"



import { Suspense } from "react"
import { AppProvider } from "@/contexts/app-context"
import { MainLayout } from "@/components/main-layout"
import { LibraryPage } from "@/components/library-page"

export const dynamic = "force-dynamic"

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
// */

