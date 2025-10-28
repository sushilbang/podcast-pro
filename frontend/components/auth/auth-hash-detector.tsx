"use client"

import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"

export function AuthHashDetector() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only check if we have a hash and we're not already in the auth handler
    if (window.location.hash && !pathname.includes("/auth/handler")) {
      const hash = window.location.hash.slice(1)
      const params = new URLSearchParams(hash)

      // Check if this is an auth token response from Supabase
      if (params.has("access_token") || params.has("error_description")) {
        console.log("[AuthHashDetector] Detected auth hash, redirecting to handler")
        // Redirect to auth handler, preserving the hash
        router.push(`/auth/handler${window.location.hash}`)
      }
    }
  }, [router, pathname])

  return null
}
