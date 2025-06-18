"use client";

import { X } from "lucide-react";
import { Button } from "./button";

type Podcast = {
  id: number;
  final_podcast_url: string | null;
};

interface AudioPlayerProps {
  podcast: Podcast;
  onClose: () => void;
}

export default function AudioPlayer({ podcast, onClose }: AudioPlayerProps) {
  if (!podcast.final_podcast_url) {
    return null; // Don't render if there's no URL
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg z-50">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
        <div className="flex-grow">
          <p className="font-semibold text-sm">Now Playing: Podcast #{podcast.id}</p>
          <audio
            key={podcast.id} // IMPORTANT: Changing the key will force React to re-create the element, starting the new track
            controls
            autoPlay
            src={podcast.final_podcast_url}
            className="w-full"
          >
            Your browser does not support the audio element.
          </audio>
        </div>
        <Button onClick={onClose} variant="ghost" size="icon">
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}