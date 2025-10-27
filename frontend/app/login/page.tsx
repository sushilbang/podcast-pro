import { LoginForm } from "@/components/auth/google-login-form"
import { GenerationDisabledPage } from "@/components/error-states/generation-disabled-page"
export default function LoginPage() {
  // Check if generation is enabled
  const generationEnabled = process.env.GENERATION_ENABLED !== 'false'
  
  // If generation is disabled, show oops page
  if (!generationEnabled) {
    return <GenerationDisabledPage />
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <LoginForm />
    </div>
  )
}
