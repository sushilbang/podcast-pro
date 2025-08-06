"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, Download, MoreHorizontal, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Podcast = {
  id: number
  status: "pending" | "processing" | "complete" | "failed"
  original_file_url: string | null
  final_podcast_url: string | null
  created_at: string
  title?: string
}

interface PodcastGridProps {
  podcasts: Podcast[]
  onPlay: (podcast: Podcast) => void
}

export function PodcastGrid({ podcasts, onPlay }: PodcastGridProps) {
  const getStatusIcon = (status: Podcast["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "processing":
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />
    }
  }

  const getStatusText = (status: Podcast["status"]) => {
    switch (status) {
      case "complete":
        return "Ready"
      case "processing":
        return "Processing"
      case "pending":
        return "Pending"
      case "failed":
        return "Failed"
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {podcasts.map((podcast) => (
        <Card key={podcast.id} className="p-6 hover:shadow-sm transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-medium mb-1 line-clamp-2">{podcast.title || `Podcast #${podcast.id}`}</h3>
              <p className="text-sm text-gray-500">{new Date(podcast.created_at).toLocaleDateString()}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Rename</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 mb-4">
            {getStatusIcon(podcast.status)}
            <span className="text-sm text-gray-600">{getStatusText(podcast.status)}</span>
          </div>

          {podcast.status === "complete" ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onPlay(podcast)} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Play
              </Button>
              <Button size="sm" variant="outline" asChild>
                <a href={podcast.final_podcast_url || "#"} download={`${podcast.title || `Podcast_${podcast.id}`}.mp3`}>
                  <Download className="w-4 h-4" />
                </a>
              </Button>
            </div>
          ) : podcast.status === "processing" || podcast.status === "pending" ? (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-1">
                <div className="bg-black h-1 rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
              <p className="text-xs text-gray-500">Converting to audio...</p>
            </div>
          ) : (
            <Button size="sm" variant="outline" disabled className="w-full bg-transparent">
              Failed to process
            </Button>
          )}
        </Card>
      ))}
    </div>
  )
}
