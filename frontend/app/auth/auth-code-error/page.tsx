import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Link from "next/link"

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold font-inter">Confirmation Failed</h1>
          <p className="text-sm text-muted-foreground font-inter">
            The confirmation link is invalid or has expired
          </p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This confirmation link may have already been used or expired. Please try signing up again or request a new confirmation email.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Link href="/auth/signup" className="block">
            <Button className="w-full font-inter font-semibold">
              Sign Up Again
            </Button>
          </Link>
          <Link href="/auth/login" className="block">
            <Button variant="outline" className="w-full font-inter font-semibold">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
