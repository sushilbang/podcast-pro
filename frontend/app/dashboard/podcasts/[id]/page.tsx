import { createClient } from "@/utils/supabase/server"
import { redirect, notFound } from "next/navigation"
import { PodcastDetailView } from "@/components/podcast-player/podcast-detail-view"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PodcastPlayerPage({ params }: PageProps) {
  const { id } = await params
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

  let podcast = null
  if (token) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/podcasts/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (res.ok) {
        podcast = await res.json();
      }
    } catch (error) {
      console.error("Failed to fetch podcast:", error)
    }
  }

  if (!podcast) {
    notFound()
  }

  return <PodcastDetailView podcast={podcast} />
}
