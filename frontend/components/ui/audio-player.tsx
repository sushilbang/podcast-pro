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
  if (!podcast.final_podcast_url) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white dark:bg-gray-900 shadow-lg border-gray-200 dark:border-gray-700">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1">
            Now Playing: <span className="font-semibold">Podcast #{podcast.id}</span>
          </p>
          <audio
            key={podcast.id}
            controls
            autoPlay
            src={podcast.final_podcast_url}
            className="w-full rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            Your browser does not support the audio element.
          </audio>
        </div>
        <div className="ml-4 shrink-0">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-gray-500 hover:text-red-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
