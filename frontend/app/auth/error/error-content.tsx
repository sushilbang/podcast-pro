"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthErrorContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get("message") || "An authentication error occurred"

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold font-inter">Authentication Error</h1>
          <p className="text-sm text-muted-foreground font-inter">
            Something went wrong with your authentication request
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{decodeURIComponent(message)}</AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Link href="/auth/login" className="block">
            <Button className="w-full font-inter font-semibold">
              Back to Login
            </Button>
          </Link>
          <Link href="/auth/signup" className="block">
            <Button variant="outline" className="w-full font-inter font-semibold">
              Create New Account
            </Button>
          </Link>
        </div>

        <p className="text-center text-sm text-muted-foreground font-inter">
          Need help?{" "}
          <Link href="/" className="text-primary hover:underline">
            Contact support
          </Link>
        </p>
      </div>
    </div>
  )
}
