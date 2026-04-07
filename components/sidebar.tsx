"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useApp, AuthResult } from "@/contexts/app-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Home,
  Search,
  Library,
  HelpCircle,
  Settings,
  Menu,
  Moon,
  Sun,
  User,
  LogOut,
  Flame,
  Zap,
} from "lucide-react"

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/search", label: "Search", icon: Search },
  { href: "/library", label: "Library", icon: Library },
  { href: "/quiz", label: "Quiz", icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()
  const {
    sidebarCollapsed,
    setSidebarCollapsed,
    darkMode,
    setDarkMode,
    user,
    isLoading,
    login,
    signup,
    logout,
  } = useApp()

  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isSignupMode, setIsSignupMode] = useState(false)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("") 
  const [password, setPassword] = useState("")
  const [rewritePassword, setRewritePassword] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const wordCounts = user
  ? { 
      New: user.statusCounts.New, 
      Learning: user.statusCounts.Learning, 
      Mastered: user.statusCounts.Mastered, 
      Forgotten: user.statusCounts.Forgotten,
      total: user.totalWordsSaved 
    }
  : { new: 0, Learning: 0, Mastered: 0, Forgotten: 0, total: 0 }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleLogin = async () => {
  if (!email || !password) {
    setErrorMessage("Please enter both email and password")
    setTimeout(() => setErrorMessage(null), 3500)
    return
  }

  const result: AuthResult = await login(email, password)

  if (!result.success) {
    setErrorMessage("Login failed. Please check your username and password")
    setTimeout(() => setErrorMessage(null), 3500)
    return
  }

  setShowLoginModal(false)
  resetForm()
}

const handleSignup = async () => {
  if (!username.trim()) {
    setErrorMessage("Username cannot be empty")
    setTimeout(() => setErrorMessage(null), 3500)
    return
  }

  if (!isValidEmail(email)) {
    setErrorMessage("Please enter a valid email address")
    setTimeout(() => setErrorMessage(null), 3500)
    return
  }

  if (password.length < 6) {
    setErrorMessage("Password needs to be at least 6 characters")
    setTimeout(() => setErrorMessage(null), 3500)
    return
  }

  if (password !== rewritePassword) {
    setErrorMessage("Password and rewritten password are inconsistent")
    setTimeout(() => setErrorMessage(null), 3500)
    return
  }

  const result: AuthResult = await signup(username, email, password)

  if (result.success) {
    setSuccessMessage("The confirmation link has been sent to your email")

    setTimeout(() => {
      setSuccessMessage(null)
      setIsSignupMode(false) // go back to login
      resetForm()
    }, 2000)

    return
  }

  if (result.error) {
    setErrorMessage(result.error)
    setTimeout(() => setErrorMessage(null), 3500)
  }
}

  const resetForm = () => {
    setUsername("")
    setEmail("") 
    setPassword("")
    setRewritePassword("")
    setErrorMessage(null)
  }

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    if (sidebarCollapsed) {
      e.preventDefault()
      setSidebarCollapsed(false)
    }
  }

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen border-r border-sidebar-border bg-sidebar transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header with profile and collapse button */}
          <div className="flex h-14 items-center justify-between border-b border-sidebar-border px-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  onClick={(e) => {
                    if (sidebarCollapsed) {
                      e.preventDefault()
                      setSidebarCollapsed(false)
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-2 py-1 hover:bg-sidebar-accent transition-colors",
                    sidebarCollapsed && "justify-center px-0 mx-auto"
                  )}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary shrink-0">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  {!sidebarCollapsed && (
                    <span className="font-medium text-sidebar-foreground">
                      {isLoading ? "Loading..." : (!!user ? user?.username : "Learner")}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              {!sidebarCollapsed && (
                <DropdownMenuContent align="start" className="w-56">
                  {isLoading ? (
                    <div className="px-3 py-2">
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                  ) : !!user ? (
                    <>
                      <div className="px-3 py-3">
                        <p className="font-medium text-foreground">Username: {user?.username}</p>
                        
                        {/* Word Collection Card */}
                        <div className="mt-3 rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-3 border border-primary/20">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Word Collection</span>
                            <span className="text-2xl font-bold text-primary">{wordCounts.total}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {wordCounts.total === 0 ? "Start your journey!" : wordCounts.total < 10 ? "Great start! Keep going!" : wordCounts.total < 50 ? "You're building momentum!" : wordCounts.total < 100 ? "Impressive collection!" : "Word master in progress!"}
                          </p>
                        </div>

                        {/* Streak Card */}
                        <div className="mt-3 rounded-lg bg-gradient-to-br from-orange-500/15 via-orange-500/5 to-transparent p-3 border border-orange-500/20">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/20">
                              <Flame className="h-4 w-4 text-orange-500" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Streak</span>
                                <span className="text-xl font-bold text-orange-500">{user?.streakDays ?? 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            {[...Array(7)].map((_, i) => (
                              <div
                                key={i}
                                className={cn(
                                  "h-2 w-2 rounded-full transition-all",
                                  i < (user?.streakDays ?? 0) ? "bg-orange-500 shadow-sm shadow-orange-500/50" : "bg-muted"
                                )}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-orange-500 font-medium mt-1.5">
                            {(user?.streakDays ?? 0) === 0 ? "Start your streak today!" : (user?.streakDays ?? 0) < 3 ? "Keep it going!" : (user?.streakDays ?? 0) < 7 ? "You're on fire!" : "Unstoppable!"}
                          </p>
                        </div>

                        {/* Today's Progress Card */}
                        <div className="mt-3 rounded-lg bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent p-3 border border-emerald-500/20">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20">
                              <Zap className="h-4 w-4 text-emerald-500" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today</span>
                                <span className="text-xl font-bold text-emerald-500">{user?.wordsToday ?? 0}</span>
                              </div>
                            </div>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(((user?.wordsToday ?? 0) / 5) * 100, 100)}%` }}
                            />
                          </div>
                          <p className="text-xs text-emerald-500 font-medium mt-1.5">
                            {(user?.wordsToday ?? 0) === 0 ? "Learn your first word!" : (user?.wordsToday ?? 0) < 3 ? "Great start today!" : (user?.wordsToday ?? 0) < 5 ? "Almost at daily goal!" : "Daily goal crushed!"}
                          </p>
                        </div>

                        {/* Status Breakdown */}
                        <div className="mt-3 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                              <span className="text-muted-foreground">New</span>
                            </div>
                            <span className="font-medium tabular-nums">{wordCounts.New}/{wordCounts.total}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                              <span className="text-muted-foreground">Learning</span>
                            </div>
                            <span className="font-medium tabular-nums">{wordCounts.Learning}/{wordCounts.total}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                              <span className="text-muted-foreground">Mastered</span>
                            </div>
                            <span className="font-medium tabular-nums">{wordCounts.Mastered}/{wordCounts.total}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                              <span className="text-muted-foreground">Forgotten</span>
                            </div>
                            <span className="font-medium tabular-nums">{wordCounts.Forgotten}/{wordCounts.total}</span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                        <LogOut className="mr-2 h-4 w-4" />
                        Log Out
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-2">
                        <p className="text-sm text-muted-foreground">You&apos;re not logged in</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setShowLoginModal(true)}>
                        Log In
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              )}
            </DropdownMenu>
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="h-8 w-8 shrink-0 text-sidebar-foreground hover:bg-sidebar-accent"
              >
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle sidebar</span>
              </Button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    sidebarCollapsed && "justify-center px-2"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </nav>

          {/* Bottom section - Settings and Menu */}
          <div className="border-t border-sidebar-border p-3 space-y-2">
            {sidebarCollapsed ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(false)}
                  className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent w-full"
                >
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarCollapsed(false)}
                  className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent w-full"
                >
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Expand sidebar</span>
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => setDarkMode(!darkMode)}>
                    {darkMode ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" />
                        Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" />
                        Dark Mode
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </aside>

      {/* Login/Signup Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isSignupMode ? "Sign Up" : "Log In"}</DialogTitle>
          </DialogHeader>

          {errorMessage && (
            <div className="bg-destructive/10 text-destructive text-sm px-3 py-2 rounded-md animate-in fade-in">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
              <div className="bg-green-500 text-white px-6 py-3 rounded-md shadow-lg animate-in fade-in">
                {successMessage}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {isSignupMode && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>
          )}

            {/* Email only for signup */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

            {isSignupMode && (
              <div className="space-y-2">
                <Label htmlFor="rewrite-password">Rewrite Password</Label>
                <Input
                  id="rewrite-password"
                  type="password"
                  value={rewritePassword}
                  onChange={(e) => setRewritePassword(e.target.value)}
                  placeholder="Rewrite your password"
                />
              </div>
            )}

            {isSignupMode ? (
              <div className="space-y-2">
                <Button onClick={handleSignup} className="w-full">
                  Sign Up
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsSignupMode(false)
                    resetForm()
                  }}
                  className="w-full text-sm"
                >
                  Back to Log In
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button onClick={handleLogin} className="w-full">
                  Log In
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsSignupMode(true)
                    resetForm()
                  }}
                  className="w-full text-sm"
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
