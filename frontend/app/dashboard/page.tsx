import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { PodcastUploadForm } from "@/components/dashboard/podcast-upload-form"

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  return <PodcastUploadForm />
}
