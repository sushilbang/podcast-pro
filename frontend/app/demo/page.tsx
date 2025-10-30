"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { useAuthRedirect } from "@/utils/hooks/useAuthRedirect"

// Dynamic import to avoid hydration errors
const PodcastPlayer = dynamic(() => import("@/components/podcast-player/podcast-simple-player"), {
  ssr: false,
  loading: () => (
    <div className="w-full max-w-4xl mx-auto">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4"></div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-96 bg-muted rounded-lg"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      </div>
    </div>
  ),
})

export default function DemoPage() {
  useAuthRedirect()
  const sampleScript = `The ancient city of Vijayanagara, now modern-day Hampi in Karnataka, India, was once the glorious capital of the Vijayanagara Empire. Founded in the 14th century, it was a thriving metropolis, renowned for its immense wealth, magnificent temples, and sophisticated water management systems. 

European travelers of the time described it as one of the most prosperous and beautiful cities in the world. Its decline began with the Battle of Talikota in 1565, leading to its eventual abandonment. 

Today, Hampi is a UNESCO World Heritage Site, a sprawling open-air museum of ruins that continues to awe visitors with its architectural grandeur and historical significance, reflecting a golden era of South Indian history.`

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-background/80 backdrop-blur-sm">
        <Link className="flex items-center justify-center" href="/">
            <span className="ml-2 text-2xl font-inter font-bold bg-black text-white px-3 py-1 rounded">Pod</span>
        </Link>
        <div className="ml-auto">
          <Button variant="ghost" size="sm" className="font-inter font-semibold" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-inter font-bold tracking-tight mb-4">Experience the Result</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-inter">
              Here&apos;s an example of how your content gets transformed into a professional podcast. Listen to the audio
              and read the generated script below.
            </p>
          </div>

          <PodcastPlayer
            title="The Ancient City of Vijayanagara"
            script={sampleScript}
            audioUrl="/audio/podcast_8.mp3"
            duration="2:34"
          />

          <div className="text-center mt-12">
            <div className="space-y-4">
              <h3 className="text-2xl font-inter font-bold">Ready to Create Your Own?</h3>
              <p className="text-muted-foreground font-inter">
                Transform your content into engaging podcasts in just a few clicks.
              </p>
              <div className="flex gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link href="/login" className="font-inter font-semibold">Get Started</Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/" className="font-inter font-semibold">Learn More</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
