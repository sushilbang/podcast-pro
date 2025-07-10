import type { EmailOtpType } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as EmailOtpType | null
  const next = searchParams.get("next") ?? "/dashboard"

  // Handle OAuth callback (Google, GitHub, etc.)
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Force a redirect that will refresh the session
      const redirectResponse = NextResponse.redirect(`${origin}${next}`)
      // Set cache headers to prevent caching of this redirect
      redirectResponse.headers.set("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate")
      return redirectResponse
    }
  }

  // Handle email verification (signup confirmation, password reset, etc.)
  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    if (!error) {
      const redirectResponse = NextResponse.redirect(`${origin}${next}`)
      redirectResponse.headers.set("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate")
      return redirectResponse
    }
  }

  // redirect the user to an error page with instructions
  return NextResponse.redirect(`${origin}/error`)
}
