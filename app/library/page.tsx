"use client"

export const dynamic = "force-dynamic" // 🔥 CRITICAL: disables prerender

import dynamicImport from "next/dynamic"

const LibraryWrapper = dynamicImport(
  () => import("@/components/library-wrapper"),
  { ssr: false }
)

export default function Page() {
  return <LibraryWrapper />
}
//*/

/*
"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

//export const dynamic = "force-dynamic"

// This is the key - dynamically import the ENTIRE page with SSR disabled
const LibraryPageContent = dynamic(
  () => import("./library-content"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading library...</div>
      </div>
    )
  }
)

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LibraryPageContent />
    </Suspense>
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

