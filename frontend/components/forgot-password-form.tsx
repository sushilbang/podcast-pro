import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"
import { resetPassword } from "@/app/login/actions"
import Link from "next/link"

export function ForgotPasswordForm() {
  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">Reset Password</CardTitle>
        <CardDescription className="text-center">
          Enter your email address and we&apos;ll send you a reset link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input id="email" name="email" type="email" placeholder="Enter your email" className="pl-10" required />
            </div>
          </div>

          <Button type="submit" formAction={resetPassword} className="w-full">
            Send Reset Link
          </Button>
        </form>

        <div className="mt-4 text-center">
          <Link href="/login" className="text-sm text-blue-600 hover:text-blue-500">
            Back to Login
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
