"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createClient } from "@/utils/supabase/server"

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()

  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (password !== confirmPassword) {
    redirect("/error?message=Passwords do not match")
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  })

  if (error) {
    redirect("/error")
  }

  revalidatePath("/", "layout")
  redirect("/dashboard?message=Password updated successfully")
}
