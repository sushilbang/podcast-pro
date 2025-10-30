"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { toast } from "sonner"

type Podcast = {
  id: number
  title?: string
  status: "pending" | "processing" | "complete" | "failed"
  created_at: string
}

interface PodcastCreationClientProps {
  podcast: Podcast
}

export function PodcastCreationStatus({ podcast: initialPodcast }: PodcastCreationClientProps) {
  const [podcast, setPodcast] = useState(initialPodcast)
  const [animationKey, setAnimationKey] = useState(0)
  const router = useRouter()
  const supabase = createClient()
  const contentRef = useRef<HTMLDivElement>(null)

  // Force animation restart when status changes
  useEffect(() => {
    setAnimationKey(prev => prev + 1)
    // Force a reflow to restart animations
    if (contentRef.current) {
      void contentRef.current.offsetHeight
    }
  }, [podcast.status])

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
            toast.error("Podcast creation failed. Please try again.");
            router.push("/dashboard");
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
          title: "Queued",
          description: "Your podcast is in the queue.",
          animationClass: "animate-pulse"
        }
      case "processing":
        return {
          title: "Creating",
          description: "Converting your document to audio...",
          animationClass: ""
        }
      case "complete":
        return {
          title: "Ready!",
          description: "Your podcast is ready to listen.",
          animationClass: "animate-pulse"
        }
      case "failed":
        return {
          title: "Failed",
          description: "Something went wrong. Please try again.",
          animationClass: ""
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <style>{`
        @keyframes dots {
          0%, 20% { content: '.'; }
          40% { content: '..'; }
          60%, 100% { content: '...'; }
        }

        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
          }
          50% {
            box-shadow: 0 0 0 15px rgba(0, 0, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .pulse-ring {
          animation: pulse-ring 2s infinite;
        }

        .slide-up {
          animation: slide-up 0.6s ease-out;
        }

        .fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .loading-bar {
          animation: loading 2s ease-in-out infinite;
        }

        @keyframes loading {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }

        .success-check {
          animation: check-bounce 0.6s ease-out;
        }

        @keyframes check-bounce {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        .dot-animate::after {
          content: '';
          animation: dots 1.4s steps(4, end) infinite;
        }
      `}</style>

      <div
        ref={contentRef}
        key={`status-${podcast.status}-${animationKey}`}
        className="max-w-md w-full text-center space-y-8 fade-in"
      >
        {/* Animated indicator based on status */}
        <div className="flex justify-center">
          {podcast.status === "processing" && (
            <div key="processing-indicator" className="w-20 h-20 rounded-full border-4 border-gray-200 flex items-center justify-center pulse-ring">
              <div className="w-16 h-16 rounded-full border-4 border-t-black border-r-black border-b-gray-200 border-l-gray-200 animate-spin"></div>
            </div>
          )}

          {podcast.status === "pending" && (
            <div key="pending-indicator" className="w-20 h-20 rounded-full border-4 border-gray-200 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 animate-pulse flex items-center justify-center">
                <div className="text-gray-400 text-sm font-medium">...</div>
              </div>
            </div>
          )}

          {podcast.status === "complete" && (
            <div key="complete-indicator" className="w-20 h-20 rounded-full bg-black flex items-center justify-center success-check">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}

          {podcast.status === "failed" && (
            <div key="failed-indicator" className="w-20 h-20 rounded-full bg-gray-800 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        {/* Status text */}
        <div key="status-text" className="space-y-3 slide-up">
          <h1 className="text-3xl font-bold text-black">
            {statusDisplay.title}
          </h1>
          <p className="text-gray-500 text-base leading-relaxed">
            {statusDisplay.description}
          </p>
        </div>

        {/* Processing state - show loading bar */}
        {podcast.status === "processing" && (
          <div key="loading-bar" className="space-y-4 slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
              <div className="bg-black h-full loading-bar"></div>
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-wider">
              Usually takes 2-5 minutes
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div key="action-buttons" className="space-y-3 slide-up" style={{ animationDelay: "0.3s" }}>
          {podcast.status === "complete" && (
            <Button
              onClick={() => router.push(`/dashboard/podcasts/${podcast.id}`)}
              className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-3 rounded-lg transition-all duration-200"
            >
              Listen Now
            </Button>
          )}

          {podcast.status === "failed" && (
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-3 rounded-lg transition-all duration-200"
            >
              Try Again
            </Button>
          )}

          <Button
            onClick={() => router.push("/dashboard/podcasts")}
            className="w-full bg-white hover:bg-gray-50 text-black border-2 border-black font-semibold py-3 rounded-lg transition-all duration-200"
          >
            Back to Library
          </Button>
        </div>
      </div>
    </div>
  )
}
