"use client"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { signInWithGoogle } from "@/app/login/actions"
import { Loader } from "lucide-react"

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      const err = error instanceof Error ? error : new Error("An unexpected error occurred")
      console.error("Google sign-in failed:", err.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row overflow-hidden shadow-xl rounded-2xl h-[600px] bg-white">
      {/* Left image section */}
      <div className="md:w-1/2 w-full relative h-60 md:h-auto rounded-t-2xl md:rounded-t-none md:rounded-l-2xl overflow-hidden">
        <Image
          src="/images/pod_thumb.png"
          alt="Pod Thumbnail"
          fill
          className="object-cover"
        />
      </div>

      {/* Right form section */}
      <div className="md:w-1/2 w-full p-8 flex flex-col justify-center">
        <div className="space-y-2 text-center md:text-left mb-6">
          <h1 className="text-2xl font-orbitron">Welcome to Pod</h1>
          <p className="text-sm text-muted-foreground font-geist-mono">
            Sign in using your Google account to continue
          </p>
        </div>

        <div className="pt-4">
          <Button
            onClick={handleGoogleLogin}
            variant="outline"
            className="w-full hover:cursor-pointer font-orbitron"
            disabled={isLoading}
          >
            {isLoading ? (
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
            {isLoading ? "Signing In..." : "Continue with Google"}
          </Button>
        </div>
      </div>
    </div>
  )
}