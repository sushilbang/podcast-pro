"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Play, Pause, RotateCcw, Volume2, Download, Share2, FileText, Headphones, Sparkles } from "lucide-react"

interface PodcastPlayerProps {
  title?: string
  script: string
  audioUrl: string
  duration?: string
  sourceUrl?: string
}

// Generate consistent waveform data
const generateWaveformData = () => {
  const data = []
  for (let i = 0; i < 40; i++) {
    // Use a deterministic pattern instead of Math.random()
    const height = 20 + Math.sin(i * 0.5) * 30 + Math.cos(i * 0.3) * 20
    data.push(Math.abs(height))
  }
  return data
}

export default function PodcastPlayer({
  title = "Generated Podcast",
  script,
  audioUrl,
  duration = "2:34",
  sourceUrl,
}: PodcastPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [showScript, setShowScript] = useState(true)
  const [mounted, setMounted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Generate consistent waveform data
  const waveformData = generateWaveformData()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setTotalDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [mounted])

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

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return

    const newTime = (Number.parseFloat(e.target.value) / 100) * totalDuration
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    const newVolume = Number.parseFloat(e.target.value) / 100
    setVolume(newVolume)
    if (audio) {
      audio.volume = newVolume
    }
  }

  const resetAudio = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = 0
    setCurrentTime(0)
    setIsPlaying(false)
    audio.pause()
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = audioUrl
    link.download = `${title.replace(/\s+/g, "_")}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: "Check out this AI-generated podcast!",
          url: window.location.href,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      // Fallback: copy to clipboard
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href)
        alert("Link copied to clipboard!")
      }
    }
  }

  if (!mounted) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-4"></div>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-96 bg-muted rounded-lg"></div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <Badge variant="secondary" className="mb-2">
          <Sparkles className="h-4 w-4 mr-2" />
          AI Generated
        </Badge>
        <h2 className="text-2xl font-bold font-orbitron">{title}</h2>
        <p className="text-muted-foreground font-geist-mono">Your content has been transformed into a podcast</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Audio Player */}
        <Card className="order-2 lg:order-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-orbitron">
              <Headphones className="h-5 w-5" />
              Audio Player
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Waveform Visualization */}
            <div className="relative h-20 bg-muted/30 rounded-lg overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-end gap-1 h-12">
                  {waveformData.map((height, i) => (
                    <div
                      key={i}
                      className={`w-1 bg-primary/60 rounded-full transition-all duration-150 ${
                        isPlaying ? "animate-pulse" : ""
                      }`}
                      style={{
                        height: `${height}%`,
                        animationDelay: `${i * 50}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>
              {/* Progress overlay */}
              <div
                className="absolute top-0 left-0 h-full bg-primary/20 transition-all duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleSeek}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(totalDuration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button onClick={togglePlay} size="lg" className="rounded-full">
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                <Button onClick={resetAudio} variant="outline" size="sm">
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume * 100}
                  onChange={handleVolumeChange}
                  className="w-20 h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button onClick={handleDownload} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button onClick={handleShare} variant="outline" className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{duration}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium">MP3, 128kbps</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Generated:</span>
                <span className="font-medium">Just now</span>
              </div>
            </div>

            <audio ref={audioRef} src={audioUrl} preload="metadata" />
          </CardContent>
        </Card>

        {/* Script Display */}
        <Card className="order-1 lg:order-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 font-orbitron">
                <FileText className="h-5 w-5" />
                Input Script
              </CardTitle>
              <Button variant="outline" size="sm" className="font-orbitron" onClick={() => setShowScript(!showScript)}>
                {showScript ? "Hide" : "Show"}
              </Button>
            </div>
          </CardHeader>
          {showScript && (
            <CardContent>
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{script}</p>
                  </div>
                </div>
              </ScrollArea>

              {sourceUrl && (
                <>
                  <Separator className="my-4" />
                  <div className="text-sm text-muted-foreground">
                    <strong>Source:</strong>{" "}
                    <a
                      href={sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {sourceUrl}
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          )}
        </Card>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid hsl(var(--background));
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: 2px solid hsl(var(--background));
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .slider::-webkit-slider-track {
          background: hsl(var(--muted));
          border-radius: 4px;
        }

        .slider::-moz-range-track {
          background: hsl(var(--muted));
          border-radius: 4px;
        }
      `}</style>
    </div>
  )
}
