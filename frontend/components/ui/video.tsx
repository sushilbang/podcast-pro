"use client"

import { Play } from "lucide-react"

export function Video() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-black">
        <video className="w-full h-full object-cover" autoPlay muted loop playsInline preload="metadata">
          <source src="/video/demo.mp4" type="video/mp4" />
          <track src="/path/to/captions.vtt" kind="subtitles" srcLang="en" label="English" />
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">Your browser does not support the video tag.</p>
          </div>
        </video>

        {/* Optional overlay with play button for manual control */}
        <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <button
            className="bg-white/90 hover:bg-white text-black rounded-full p-4 transition-colors"
            onClick={(e) => {
              const video = e.currentTarget.parentElement?.previousElementSibling as HTMLVideoElement
              if (video.paused) {
                video.play()
              } else {
                video.pause()
              }
            }}
          >
            <Play className="h-8 w-8" />
          </button>
        </div>
      </div>
    </div>
  )
}
