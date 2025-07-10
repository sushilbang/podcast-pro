"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function Header() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
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

      // Clear any local storage if needed
      localStorage.removeItem("hasSeenWelcomeMessage")

      // Redirect to login page
      router.replace("/login")
    } catch (error) {
      console.error("Unexpected logout error:", error)
      toast.error("An unexpected error occurred during logout")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="w-full max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold">
          Pod🎧
        </Link>

        <Button onClick={handleLogout} variant="outline" disabled={isLoggingOut}>
          {isLoggingOut ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging out...
            </>
          ) : (
            "Logout"
          )}
        </Button>
      </div>
    </header>
  )
}
