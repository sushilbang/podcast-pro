"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader, AlertCircle, CheckCircle } from "lucide-react"
import { sendResetPasswordEmail } from "@/utils/supabase/actions"
import { useAuthRedirect } from "@/utils/hooks/useAuthRedirect"

export default function ResetPasswordPage() {
  useAuthRedirect()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("email", email)

      const result = await sendResetPasswordEmail(null, formData)
      if (result?.success) {
        setSuccess(true)
        setEmail("")
      } else {
        setError(result?.error || "Failed to send reset email")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-inter mb-2">Reset Password</h1>
          <p className="text-muted-foreground font-inter">Enter your email to receive reset instructions</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Check your email for password reset instructions
            </AlertDescription>
          </Alert>
        )}

        {!success && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              className="w-full font-inter font-semibold"
              disabled={isLoading || !email}
            >
              {isLoading ? (
                <>
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
        )}

        {/* Back to Login Link */}
        <div className="text-center pt-6 border-t border-muted">
          <p className="text-sm text-muted-foreground font-inter">
            Remember your password?{" "}
            <Link
              href="/auth/login"
              className="text-foreground font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
