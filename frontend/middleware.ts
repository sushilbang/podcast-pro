import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  // Define public routes that don't require authentication
  const publicRoutes = ["/", "/login", "/signup", "/demo", "/auth"]

  // Skip middleware for auth callback, static files, and API routes
  if (
    request.nextUrl.pathname.startsWith("/auth/callback") ||
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.includes(".")
  ) {
    return supabaseResponse
  }

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(
    (route) => request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(`${route}/`),
  )

  // If it's a public route, allow access without authentication
  if (isPublicRoute) {
    return supabaseResponse
  }

  // For protected routes (like dashboard), check authentication
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  console.log(
    `Middleware - Path: ${request.nextUrl.pathname}, User: ${user?.email || "none"}, Error: ${error?.message || "none"}`,
  )

  // Redirect to login if no user for protected routes
  if (!user) {
    console.log(`Middleware - Redirecting to login from ${request.nextUrl.pathname}`)
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
