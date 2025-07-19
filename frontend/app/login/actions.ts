"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export async function signInWithGoogle() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) {
    redirect("/error")
  }
  if (data?.url) {
    redirect(data.url)
  }
}

export async function logout() {
  const supabase = await createClient()

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error("Logout error:", error)
    throw new Error("Failed to logout")
  }

  // Redirect to login page after successful logout
  redirect("/")
}

