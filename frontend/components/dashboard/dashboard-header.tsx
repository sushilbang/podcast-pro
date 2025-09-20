"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { User, LogOut, Headphones } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { createClient } from "@/utils/supabase/client"

export function DashboardHeader() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    if (isLoggingOut) return

    setIsLoggingOut(true)
      try {
        console.log("Starting logout process...")
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error("Logout error:", error)
          toast.error("Failed to logout. Please try again.")
          return
        }
        console.log("Logout successful, redirecting...")
        toast.success("Logged out successfully")
        router.replace("/")
      } catch (error) {
        console.error("Unexpected logout error:", error)
        toast.error("An unexpected error occurred during logout")
      } finally {
        setIsLoggingOut(false)
      }
  }

  const handleNavigation = (href: string, actionId: string) => {
    setLoadingAction(actionId)
    router.push(href)
    // Reset after navigation
    setTimeout(() => setLoadingAction(null), 1000)
  }

  return (
    <header className="border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2" disabled={isLoggingOut}>
              {loadingAction === "menu" ? <LoadingSpinner size="sm" /> : <User className="w-4 h-4" />}
              <span className="hidden sm:inline">{loadingAction === "menu" ? "Loading..." : "Account"}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              onClick={() => handleNavigation("/dashboard/podcasts", "podcasts")}
              disabled={isLoggingOut}
              className="flex items-center gap-2"
            >
              {loadingAction === "podcasts" ? <LoadingSpinner size="sm" /> : <Headphones className="w-4 h-4" />}
              {loadingAction === "podcasts" ? "Loading..." : "Your Podcasts"}
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="flex items-center gap-2 text-red-600"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <LoadingSpinner size="sm" className="border-t-red-600" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              {isLoggingOut ? "Signing out..." : "Sign out"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
