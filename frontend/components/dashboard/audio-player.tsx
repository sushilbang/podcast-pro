"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, X, Volume2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"

type Podcast = {
  id: number
  status: "pending" | "processing" | "complete" | "failed"
  original_file_url: string | null
  final_podcast_url: string | null
  created_at: string
  title?: string
}

interface AudioPlayerProps {
  podcast: Podcast
  onClose: () => void
}

export function AudioPlayer({ podcast, onClose }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

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
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
      <audio ref={audioRef} src={podcast.final_podcast_url || "/sample-podcast.mp3"} preload="metadata" />

      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={togglePlay} className="shrink-0">
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-4 mb-2">
              <span className="text-sm font-medium truncate">{podcast.title || `Podcast #${podcast.id}`}</span>
              <Button variant="ghost" size="sm" onClick={onClose} className="shrink-0 ml-auto">
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-10">{formatTime(currentTime)}</span>

              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="flex-1"
              />

              <span className="text-xs text-gray-500 w-10">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <Volume2 className="w-4 h-4 text-gray-500" />
            <Slider value={[volume]} max={1} step={0.1} onValueChange={handleVolumeChange} className="w-20" />
          </div>
        </div>
      </div>
    </div>
  )
}
