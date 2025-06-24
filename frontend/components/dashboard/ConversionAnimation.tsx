// frontend/components/dashboard/ConversionAnimation.tsx

"use client";

import React, { useState, useEffect } from "react";
// import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Brain,
  Zap,
  AudioWaveformIcon as Waveform,
  XCircle,
} from "lucide-react";

// The status type from our main page
type PodcastStatus = 'pending' | 'processing' | 'complete' | 'failed';

// Define the steps of our animation
const conversionSteps = [
  { id: "extract", title: "AI Extraction", description: "Extracting key insights...", icon: <Brain className="h-5 w-5" /> },
  { id: "process", title: "Script Generation", description: "Creating podcast script...", icon: <Zap className="h-5 w-5" /> },
  { id: "synthesize", title: "Audio Synthesis", description: "Generating natural voice...", icon: <Waveform className="h-5 w-5" /> },
];

interface ConversionAnimationProps {
  status: PodcastStatus; // The component is now driven by this prop
}

export default function ConversionAnimation({ status }: ConversionAnimationProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // This useEffect is the new "engine". It reacts to changes in the real status.
  useEffect(() => {
    // Map the real status to a visual step in our animation
    if (status === 'pending' || status === 'processing') {
      const totalSteps = conversionSteps.length;
      
      // We'll cycle through the steps to create a continuous animation loop
      // instead of a one-time progress bar.
      const interval = setInterval(() => {
        setCurrentStepIndex((prev) => (prev + 1) % totalSteps);
      }, 2000); // Change step every 2 seconds

      // The progress bar will also animate to give a sense of activity
      setProgress(prev => (prev > 90 ? 10 : prev + 10));

      return () => clearInterval(interval); // Cleanup on status change
    }

    if (status === 'complete') {
      setCurrentStepIndex(conversionSteps.length); // A special index for "complete"
      setProgress(100);
    }

    if (status === 'failed') {
      setCurrentStepIndex(-1); // A special index for "failed"
      setProgress(100);
    }

  }, [status, currentStepIndex]); // Rerun when status or animation step changes

  // --- RENDER LOGIC ---

  // Display a specific error message if the job failed
  if (status === 'failed') {
    return (
      <div className="flex items-center gap-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
        <XCircle className="h-5 w-5" />
        <div>
          <div className="font-medium">Processing Failed</div>
          <div className="text-sm">An error occurred. Please try again.</div>
        </div>
      </div>
    );
  }

  // Otherwise, render the animation steps
  return (
    <div className="space-y-4 pt-2">
      <Progress value={progress} className="h-2" />
      {conversionSteps.map((step, index) => (
        <div
          key={step.id}
          className={`
            flex items-center gap-4 p-3 rounded-lg transition-all duration-500
            ${index === currentStepIndex ? "bg-primary/10" : "opacity-60"}
          `}
        >
          <div
            className={`
              p-2 rounded-full transition-all duration-500 text-white
              ${index === currentStepIndex ? "bg-primary animate-pulse" : "bg-muted-foreground"}
            `}
          >
            {step.icon}
          </div>
          <div className="flex-1">
            <div className="font-medium">{step.title}</div>
            <div className="text-sm text-muted-foreground">
              {index === currentStepIndex ? (
                <span className="flex items-center gap-2">
                  {step.description}
                  {/* Simple dot animation */}
                  <span className="animate-pulse">...</span>
                </span>
              ) : (
                step.description
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}