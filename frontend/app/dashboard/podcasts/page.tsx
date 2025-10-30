import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { PodcastListView } from "@/components/podcast-library/podcast-list-view"

export default async function PodcastsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/auth/login")
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

  return <PodcastListView initialPodcasts={podcasts} />
}
