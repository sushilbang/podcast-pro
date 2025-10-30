"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader, AlertCircle, CheckCircle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

export function ResetPasswordForm() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Check if user has a valid session from the reset link
    const checkSession = async () => {
      const supabase = createClient()
      const { data, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !data.session) {
        setError("Invalid or expired reset link. Please request a new password reset.")
      }
    }
    checkSession()
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // Session is already established from the reset link via callback handler
      // Just update the password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError.message || "Password reset failed")
        return
      }

      setSuccess(true)
      setNewPassword("")
      setConfirmPassword("")

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/auth/login")
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold font-inter">Create New Password</h2>
        <p className="text-sm text-muted-foreground font-inter">
          Enter your new password below
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Password reset successful! Redirecting to login...
          </AlertDescription>
        </Alert>
      )}

      {!success && (
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium mb-2">
              New Password
            </label>
            <Input
              id="new-password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium mb-2">
              Confirm Password
            </label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full font-inter font-semibold"
            disabled={isLoading || !newPassword || !confirmPassword}
          >
            {isLoading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset Password"
            )}
          </Button>
        </form>
      )}
    </div>
  )
}
