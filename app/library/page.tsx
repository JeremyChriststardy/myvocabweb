import { Suspense } from "react"
import dynamic from "next/dynamic"

export const dynamic = "force-dynamic"

// Dynamically import everything with SSR disabled
const DynamicLibrary = dynamic(
  () => import("@/components/library-wrapper").then(mod => mod.default),
  { 
    ssr: false,
    loading: () => <div className="flex min-h-screen items-center justify-center">Loading...</div>
  }
)

export default function Page() {
  return <DynamicLibrary />
}

/* "use client"



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
*/ 

