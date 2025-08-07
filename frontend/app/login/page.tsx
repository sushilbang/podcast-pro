import { LoginForm } from "@/components/login-form"
import { OopsPage } from "@/components/oops/oops-page"
export default function LoginPage() {
  // Check if generation is enabled
  const generationEnabled = process.env.GENERATION_ENABLED !== 'false'
  
  // If generation is disabled, show oops page
  if (!generationEnabled) {
    return <OopsPage />
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <LoginForm />
    </div>
  )
}
