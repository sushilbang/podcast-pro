import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { ResetPasswordForm } from "@/components/reset-password-form"

export default async function ResetPasswordPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-sm text-gray-600">Enter your new password below</p>
        </div>
        <ResetPasswordForm />
      </div>
    </div>
  )
}
