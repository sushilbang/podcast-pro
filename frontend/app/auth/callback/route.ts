import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/dashboard"

  // Handle OAuth callback (Google, GitHub, etc.)
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      console.log(`redirect URL: ${origin}${next}`)
      // Force a redirect that will refresh the session
      const redirectResponse = NextResponse.redirect(`${origin}${next}`)
      // Set cache headers to prevent caching of this redirect
      redirectResponse.headers.set("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate")
      return redirectResponse
    }
  }

  // redirect the user to an error page with instructions
  return NextResponse.redirect(`${origin}/error`)
}
