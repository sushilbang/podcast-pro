"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader, AlertCircle, CheckCircle } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface AddPasswordFormProps {
  accessToken: string
  onSuccess?: () => void
}

export function AddPasswordForm({ accessToken, onSuccess }: AddPasswordFormProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleAddPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()

      // First, set the session using the access token from the OAuth login
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: "",
      })

      if (sessionError) {
        setError("Session expired. Please login again.")
        return
      }

      // Update password using the session
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message || "Failed to add password")
        return
      }

      setSuccess(true)
      setPassword("")
      setConfirmPassword("")

      // Call callback after 2 seconds
      if (onSuccess) {
        setTimeout(onSuccess, 2000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Password added successfully! You can now login with your email and password.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4 w-full max-w-md">
      <div>
        <h3 className="text-lg font-semibold mb-4">Add Password to Your Account</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Set a password to log in with email in addition to your OAuth account.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleAddPassword} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground mt-2">
            At least 8 characters
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Confirm Password
          </label>
          <Input
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
          className="w-full"
          disabled={isLoading || !password || !confirmPassword}
        >
          {isLoading ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Adding Password...
            </>
          ) : (
            "Add Password"
          )}
        </Button>
      </form>
    </div>
  )
}
