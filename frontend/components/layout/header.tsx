"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { User, LogOut } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Header() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
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

  return (
    <header className="w-full max-w-5xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-2xl font-bold">
          Pod🎧
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt="User avatar" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuItem 
              onClick={handleLogout} 
              disabled={isLoggingOut}
              className="cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? "Logging out..." : "Logout"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
