"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"
import { headers } from "next/headers"

async function getBaseURL() {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  const headersList = await headers();
  const host = headersList.get('host');
  
  if (host) {
    return `https://${host}`;
  }
  return 'https://podcast-pro-gilt.vercel.app';
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const baseURL = await getBaseURL();
  console.log(`base url: ${baseURL}`)
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${baseURL}/auth/callback`,
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

