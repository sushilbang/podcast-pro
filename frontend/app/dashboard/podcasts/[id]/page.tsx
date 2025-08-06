import { createClient } from "@/utils/supabase/server"
import { redirect, notFound } from "next/navigation"
import { PodcastPlayerClient } from "@/components/podcast-player/podcast-player-client"
import type { Podcast as PodcastType } from "@/components/podcast-player/podcast-player-client"

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
        const data = await res.json();
        const parsedPodcast: PodcastType = {
          ...data,
          tags: JSON.parse(data.tags || '[]'),
          chapters: JSON.parse(data.chapters || '[]'),
        };
        podcast = parsedPodcast;
      }
    } catch (error) {
      console.error("Failed to fetch podcast:", error)
    }
  }

  if (!podcast) {
    notFound()
  }

  return <PodcastPlayerClient podcast={podcast} />
}
