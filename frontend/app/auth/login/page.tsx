"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader, AlertCircle } from "lucide-react"
import { GenerationDisabledPage } from "@/components/error-states/generation-disabled-page"
import { signInWithGoogle, signinWithEmailPassword } from "@/utils/supabase/actions"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState("")

  // Check if generation is enabled
  const generationEnabled = process.env.GENERATION_ENABLED !== 'false'

  if (!generationEnabled) {
    return <GenerationDisabledPage />
  }

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("email", email)
      formData.append("password", password)

      await signinWithEmailPassword(null, formData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in")
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with Google")
      setIsGoogleLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-inter mb-2">Welcome to <span className="rounded" style={{ background: 'black', color: 'white', padding: '6px 12px' }}>Pod</span></h1>
          <p className="text-muted-foreground font-inter">Sign in to continue</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Login Form */}
        <div className="space-y-6">
          {/* Email & Password Form */}
          <form onSubmit={handleEmailLogin} className="space-y-4">
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
              </div>

              <Button
                type="submit"
                className="w-full font-inter font-semibold"
                disabled={isLoading || !email || !password}
              >
                {isLoading ? (
                  <>
                    <Loader className="mr-2 h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground font-inter">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Sign In */}
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full hover:cursor-pointer font-inter font-semibold"
              disabled={isGoogleLoading || isLoading}
            >
              {isGoogleLoading ? (
                <Loader className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <svg
                  className="mr-2 h-4 w-4"
                  viewBox="0 0 533.5 544.3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                >
                  <path d="M533.5 278.4c0-17.4-1.4-34.1-4.1-50.2H272v95.1h147.1c-6.4 34.5-25.3 63.7-54 83.2v68.9h87.2c51-47 81.2-116.3 81.2-197z" />
                  <path d="M272 544.3c73.5 0 135-24.4 179.9-66.3l-87.2-68.9c-24.2 16.2-55.3 25.8-92.7 25.8-71.2 0-131.6-48-153.3-112.6H27.8v70.8c44.8 89.2 136.6 151.2 244.2 151.2z" />
                  <path d="M118.7 322.3c-10.1-30.2-10.1-62.7 0-92.9V158.6H27.8c-38.4 76.9-38.4 167.2 0 244.1l90.9-70.4z" />
                  <path d="M272 107.7c39.9-.6 78.3 13.6 107.9 40.1l80.7-80.7C411.8 24.5 343.5 0 272 0 164.4 0 72.6 62 27.8 151.2l90.9 70.8c21.7-64.6 82.1-112.6 153.3-114.3z" />
                </svg>
              )}
              {isGoogleLoading ? "Signing In..." : "Continue with Google"}
            </Button>

            {/* Sign Up Link */}
            <div className="text-center pt-4 border-t border-muted">
              <p className="text-sm text-muted-foreground font-inter">
                Don&apos;t have an account?{" "}
                <Link
                  href="/auth/signup"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
      </div>
    </div>
  )
}
