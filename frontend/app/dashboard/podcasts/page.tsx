import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { PodcastsClient } from "@/components/podcasts/podcasts-client"

export default async function PodcastsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/login")
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  let podcasts = []
  if (token) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/podcasts/`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (res.ok) {
        podcasts = await res.json()
      }
    } catch (error) {
      console.error("Failed to fetch podcasts:", error)
    }
  }

  return <PodcastsClient initialPodcasts={podcasts} />
}
