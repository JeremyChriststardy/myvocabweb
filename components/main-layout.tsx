"use client"

import { cn } from "@/lib/utils"
import { useApp } from "@/contexts/app-context"
import { Sidebar } from "@/components/sidebar"

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, darkMode } = useApp()

  return (
    <div className={cn(darkMode && "dark")}>
      <Sidebar />
      <main
        className={cn(
          "min-h-screen bg-background transition-all duration-300",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="container mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
