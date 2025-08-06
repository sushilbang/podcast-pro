"use client"

export function Video() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative aspect-video rounded-xl overflow-hidden shadow-2xl bg-black">
        <video className="w-full h-full object-cover" autoPlay muted loop playsInline preload="metadata">
          <source src="/videos/demo.mp4" type="video/mp4" />
          <track src="/path/to/captions.vtt" kind="subtitles" srcLang="en" label="English" />
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <p className="text-muted-foreground">Your browser does not support the video tag.</p>
          </div>
        </video>
      </div>
    </div>
  )
}
