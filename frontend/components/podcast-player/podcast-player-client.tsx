"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  ArrowLeft,
  Clock,
  Calendar,
  Eye,
  Bookmark,
  RotateCcw,
  Heart,
} from "lucide-react"
import Link from "next/link"
import ClientOnly from "@/components/ui/client-only";

type Chapter = {
  title: string
  start: number
  end: number
}

export type Podcast = {
  id: number
  title: string
  status: "complete"
  final_podcast_url: string
  created_at: string
  duration: number
  file_size: string
  description: string
  summary: string
  tags: string[]
  plays: number
  transcript: string
  chapters: Chapter[]
}

interface PodcastPlayerClientProps {
  podcast: Podcast
}

export function PodcastPlayerClient({ podcast }: PodcastPlayerClientProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [bookmarks, setBookmarks] = useState<number[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => {
      if (audio.duration) {
        // Duration is already known from props
      }
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", () => setIsPlaying(false))

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", () => setIsPlaying(false))
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    const newVolume = value[0]
    audio.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }

  const skipTime = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, podcast.duration))
  }


  const changePlaybackSpeed = (speed: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.playbackRate = speed
    setPlaybackSpeed(speed)
  }

  const addBookmark = () => {
    if (!bookmarks.includes(Math.floor(currentTime))) {
      setBookmarks([...bookmarks, Math.floor(currentTime)].sort((a, b) => a - b))
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className={`min-h-screen bg-white fixed inset-0 z-50`}>
      <audio ref={audioRef} src={podcast.final_podcast_url} preload="metadata" />

      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 bg-white z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <Button variant="ghost" size="sm" asChild className="shrink-0">
                <Link href="/dashboard/podcasts">
                  <ArrowLeft className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Podcasts</span>
                </Link>
              </Button>
              <div className="h-6 w-px bg-gray-200 hidden sm:block" />
              <h1 className="text-sm sm:text-lg font-medium truncate">{podcast.title}</h1>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => setIsFavorite(!isFavorite)} className="hidden sm:flex">
                <Heart className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={podcast.final_podcast_url} download={`${podcast.title}.mp3`}>
                  <Download className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className={`grid gap-4 sm:gap-8 grid-cols-1`}>
          {/* Main Player */}
          <div className={`space-y-4 sm:space-y-6 "max-w-4xl mx-auto"`}>
            {/* Podcast Info */}
            <Card className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl font-light mb-2 break-words">{podcast.title}</h2>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">{podcast.description}</p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {podcast.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
                    <ClientOnly>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span className="hidden sm:inline">{formatDate(podcast.created_at)}</span>
                        <span className="sm:hidden">{new Date(podcast.created_at).toLocaleDateString()}</span>
                      </div>
                    </ClientOnly>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(podcast.duration)}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {podcast.plays} plays
                    </div>
                  </div>
                </div>
              </div>

              {/* progress bars and current chapter to be implemented */}

              {/* Audio Controls */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs sm:text-sm text-gray-500 w-8 sm:w-12 text-right">
                    {formatTime(currentTime)}
                  </span>

                  <Slider
                    value={[currentTime]}
                    max={podcast.duration}
                    step={1}
                    onValueChange={handleSeek}
                    className="flex-1"
                  />

                  <span className="text-xs sm:text-sm text-gray-500 w-8 sm:w-12">{formatTime(podcast.duration)}</span>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-center gap-2 sm:gap-4">
                  <Button variant="outline" size="sm" onClick={() => skipTime(-30)} className="gap-1">
                    <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs">30s</span>
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => skipTime(-15)} className="gap-1">
                    <SkipBack className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="text-xs">15s</span>
                  </Button>

                  <Button size="lg" onClick={togglePlay} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full">
                    {isPlaying ? (
                      <Pause className="w-4 h-4 sm:w-6 sm:h-6" />
                    ) : (
                      <Play className="w-4 h-4 sm:w-6 sm:h-6" />
                    )}
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => skipTime(15)} className="gap-1">
                    <span className="text-xs">15s</span>
                    <SkipForward className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>

                  <Button variant="outline" size="sm" onClick={addBookmark} className="gap-1 bg-transparent">
                    <Bookmark className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline text-xs">Mark</span>
                  </Button>
                </div>

                {/* Secondary Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={toggleMute}>
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-16 sm:w-20"
                    />
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-gray-500">Speed:</span>
                    {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <Button
                        key={speed}
                        variant={playbackSpeed === speed ? "default" : "outline"}
                        size="sm"
                        onClick={() => changePlaybackSpeed(speed)}
                        className="w-8 h-6 sm:w-12 sm:h-8 text-xs"
                      >
                        {speed}x
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
