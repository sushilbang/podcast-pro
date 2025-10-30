import { Suspense } from "react"
import AuthErrorContent from "@/app/auth/error/error-content"

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  )
}
