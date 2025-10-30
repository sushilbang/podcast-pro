"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export const signupWithEmailPassword = async (prev: unknown, formData: FormData) => {
  const supabase = await createClient();
  const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const {data, error} = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: {
      emailRedirectTo: `${baseURL}/auth/confirm?next=/dashboard`
    }
  })

  if (error) {
    console.error("Signup error:", error)
    throw new Error("Failed to sign up")
  }

  return {
    success: 'Please check your email',
    error: null
  }
}

export const signinWithEmailPassword = async (prev: unknown, formData: FormData) => {
  const supabase = await createClient();
  const {data, error} = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) {
    console.error("Signin error:", error)
    throw new Error("Failed to sign in")
  }
  redirect("/dashboard")
}

export const sendResetPasswordEmail = async (prev: unknown, formData: FormData) => {
  const supabase = await createClient();

  const {data, error} = await supabase.auth.resetPasswordForEmail(
    formData.get('email') as string,
  )

  if(error) {
    console.log('Error sending reset password email:', error)
    throw new Error("Failed to send reset password email")
  }

  return {
    success: 'Please check your email for password reset instructions',
    error: null
  }

}

export const updatePassword = async (prev: unknown, formData: FormData) => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({
    password: formData.get('password') as string,
  })
  if (error) {
    console.error("Update password error:", error)
    throw new Error("Failed to update password")
  }
  redirect("/dashboard")
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const baseURL = process.env.NEXT_PUBLIC_SITE_URL;
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

