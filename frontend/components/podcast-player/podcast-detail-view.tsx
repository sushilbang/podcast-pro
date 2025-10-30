"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  ArrowLeft,
  Clock,
  Calendar,
} from "lucide-react"
import Link from "next/link"
import ClientOnly from "@/components/utilities/client-only-wrapper";

export type Podcast = {
  id: string
  title: string
  status: "complete"
  final_podcast_url: string
  stream_url: string
  created_at: string
  duration: number
}

interface PodcastPlayerClientProps {
  podcast: Podcast
}

export function PodcastDetailView({ podcast }: PodcastPlayerClientProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className={`min-h-screen bg-white fixed inset-0 z-50`}>
      <audio ref={audioRef} src={podcast.stream_url} preload="metadata" />

      {/* Header */}
      <header className="border-b border-black/10 sticky top-0 bg-white z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild className="shrink-0 hover:bg-gray-100">
              <Link href="/dashboard/podcasts">
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </Button>
            <h1 className="text-sm sm:text-base font-medium truncate flex-1 mx-4">{podcast.title}</h1>
          </div>
        </div>
      </header>

      <div className="w-full flex items-center justify-center px-4 py-4 sm:py-8">
        <div className="w-full max-w-2xl">
          {/* Title Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-medium text-black mb-2">{podcast.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs sm:text-sm text-black/60 justify-center">
              <ClientOnly>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(podcast.created_at).toLocaleDateString()}</span>
                </div>
              </ClientOnly>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{formatTime(podcast.duration)}</span>
              </div>
            </div>
          </div>

          {/* Main Player */}
          <div className="space-y-4 sm:space-y-6">
            {/* Podcast Info */}
            <Card className="p-4 sm:p-6 border-black/10 bg-white">
              <div className="mb-6"></div>

              {/* progress bars and current chapter to be implemented */}

              {/* Audio Controls */}
              <div className="space-y-6">
                {/* Progress Bar */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="text-xs text-black/60 w-10 text-right">
                    {formatTime(currentTime)}
                  </span>

                  <Slider
                    value={[currentTime]}
                    max={podcast.duration}
                    step={1}
                    onValueChange={handleSeek}
                    className="flex-1"
                  />

                  <span className="text-xs text-black/60 w-10">{formatTime(podcast.duration)}</span>
                </div>

                {/* Main Controls */}
                <div className="flex items-center justify-center gap-3 sm:gap-6">
                  <Button variant="ghost" size="sm" onClick={() => skipTime(-15)} className="p-2 hover:bg-black/5">
                    <SkipBack className="w-5 h-5" />
                  </Button>

                  <Button size="lg" onClick={togglePlay} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black hover:bg-black/90 text-white">
                    {isPlaying ? (
                      <Pause className="w-6 h-6 sm:w-7 sm:h-7" />
                    ) : (
                      <Play className="w-6 h-6 sm:w-7 sm:h-7 ml-0.5" />
                    )}
                  </Button>

                  <Button variant="ghost" size="sm" onClick={() => skipTime(15)} className="p-2 hover:bg-black/5">
                    <SkipForward className="w-5 h-5" />
                  </Button>
                </div>

                {/* Secondary Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={toggleMute} className="p-2 hover:bg-black/5">
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-16 sm:w-24"
                    />
                  </div>

                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className="text-xs text-black/60">Speed:</span>
                    {[0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <Button
                        key={speed}
                        variant={playbackSpeed === speed ? "default" : "outline"}
                        size="sm"
                        onClick={() => changePlaybackSpeed(speed)}
                        className={`w-10 h-8 text-xs font-medium ${
                          playbackSpeed === speed
                            ? "bg-black text-white hover:bg-black/90"
                            : "bg-white text-black border-black/20 hover:bg-black/5"
                        }`}
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
