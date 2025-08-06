"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { CheckCircle, Clock, AlertCircle, RefreshCw } from 'lucide-react'
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

type Podcast = {
  id: number
  title?: string
  status: "pending" | "processing" | "complete" | "failed"
  created_at: string
}

interface PodcastCreationClientProps {
  podcast: Podcast
}

export function PodcastCreationClient({ podcast: initialPodcast }: PodcastCreationClientProps) {
  const [podcast, setPodcast] = useState(initialPodcast)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (podcast.status === "complete" || podcast.status === "failed") {
      return
    }

    const pollInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/podcasts/${podcast.id}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: "no-store",
        })

        if (res.ok) {
          const updatedPodcast = await res.json()
          setPodcast(updatedPodcast)

          if (updatedPodcast.status === "complete") {
            setTimeout(() => {
              router.push(`/dashboard/podcasts/${podcast.id}`)
            }, 2000)
          } else if (updatedPodcast.status === "failed") {
            // will see
          }
        }
      } catch (error) {
        console.error("Failed to poll podcast status:", error)
      }
    }, 3000)

    return () => clearInterval(pollInterval)
  }, [podcast.id, podcast.status, router, supabase])

  const getStatusDisplay = () => {
    switch (podcast.status) {
      case "pending":
        return {
          icon: <Clock className="h-12 w-12 text-yellow-500" />,
          title: "Queued",
          description: "Your podcast is in the queue.",
          color: "text-yellow-600"
        }
      case "processing":
        return {
          icon: <RefreshCw className="h-12 w-12 text-blue-500 animate-spin" />,
          title: "Creating",
          description: "Converting your document to audio...",
          color: "text-blue-600"
        }
      case "complete":
        return {
          icon: <CheckCircle className="h-12 w-12 text-green-500" />,
          title: "Ready!",
          description: "Your podcast is ready to listen.",
          color: "text-green-600"
        }
      case "failed":
        return {
          icon: <AlertCircle className="h-12 w-12 text-red-500" />,
          title: "Failed",
          description: "Something went wrong. Please try again.",
          color: "text-red-600"
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="max-w-sm w-full text-center space-y-8">
        <div className="flex justify-center">
          {statusDisplay.icon}
        </div>
        
        <div className="space-y-2">
          <h1 className={`text-2xl font-semibold ${statusDisplay.color}`}>
            {statusDisplay.title}
          </h1>
          <p className="text-gray-600">
            {statusDisplay.description}
          </p>
        </div>

        {podcast.status === "processing" && (
          <div className="space-y-3">
            <LoadingSpinner className="mx-auto" />
            <p className="text-sm text-gray-500">
              Usually takes 2-5 minutes
            </p>
          </div>
        )}

        <div className="space-y-3">
          {podcast.status === "complete" && (
            <Button 
              onClick={() => router.push(`/dashboard/podcasts/${podcast.id}`)}
              className="w-full"
            >
              Listen Now
            </Button>
          )}
          
          {podcast.status === "failed" && (
            <Button 
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              Try Again
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => router.push("/dashboard/podcasts")}
            className="w-full bg-transparent"
          >
            Back to Library
          </Button>
        </div>
      </div>
    </div>
  )
}
