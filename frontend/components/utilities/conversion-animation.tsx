"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  FileText,
  Zap,
  Brain,
  AudioWaveformIcon as Waveform,
  Headphones,
  Play,
  Upload,
  CheckCircle,
  Sparkles,
} from "lucide-react"

interface ConversionStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  duration: number
  color: string
}

const contentTypes = [
  { icon: <FileText className="h-6 w-6" />, name: "research-paper.pdf", type: "PDF Document" },
]

const conversionSteps: ConversionStep[] = [
  {
    id: "upload",
    title: "Content Upload",
    description: "Analyzing your content...",
    icon: <Upload className="h-5 w-5" />,
    duration: 1500,
    color: "bg-blue-500",
  },
  {
    id: "extract",
    title: "AI Extraction",
    description: "Extracting key insights...",
    icon: <Brain className="h-5 w-5" />,
    duration: 2000,
    color: "bg-purple-500",
  },
  {
    id: "process",
    title: "Script Generation",
    description: "Creating podcast script...",
    icon: <Zap className="h-5 w-5" />,
    duration: 1800,
    color: "bg-yellow-500",
  },
  {
    id: "synthesize",
    title: "Audio Synthesis",
    description: "Generating natural voice...",
    icon: <Waveform className="h-5 w-5" />,
    duration: 2200,
    color: "bg-green-500",
  },
  {
    id: "complete",
    title: "Podcast Ready",
    description: "Your podcast is ready to listen!",
    icon: <CheckCircle className="h-5 w-5" />,
    duration: 1000,
    color: "bg-emerald-500",
  },
]

export default function ConversionAnimation() {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)
  const [currentContent, setCurrentContent] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (!isAnimating) return

    const totalSteps = conversionSteps.length
    const currentStepData = conversionSteps[currentStep]

    if (currentStep < totalSteps) {
      const stepProgress = 100 / totalSteps
      const startProgress = currentStep * stepProgress

      // Animate progress for current step
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          const newProgress = prev + stepProgress / (currentStepData.duration / 50)
          if (newProgress >= startProgress + stepProgress) {
            clearInterval(progressInterval)

            // Move to next step after a brief pause
            setTimeout(() => {
              if (currentStep < totalSteps - 1) {
                setCurrentStep((prev) => prev + 1)
              } else {
                // Animation complete, reset after delay
                setTimeout(() => {
                  setCurrentStep(0)
                  setProgress(0)
                  setCurrentContent((prev) => (prev + 1) % contentTypes.length)
                  setIsAnimating(false)
                }, 2000)
              }
            }, 200)

            return startProgress + stepProgress
          }
          return newProgress
        })
      }, 50)

      return () => clearInterval(progressInterval)
    }
  }, [currentStep, isAnimating])

  useEffect(() => {
    // Auto-start animation
    const timer = setTimeout(() => {
      setIsAnimating(true)
    }, 1000)

    return () => clearTimeout(timer)
  }, [currentContent])

  const startAnimation = () => {
    if (!isAnimating) {
      setCurrentStep(0)
      setProgress(0)
      setIsAnimating(true)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <Badge variant="secondary" className="mb-4">
          <Sparkles className="h-4 w-4 mr-2" />
          Live Demo
        </Badge>
        <h3 className="text-2xl font-bold mb-2">Watch the Magic Happen</h3>
        <p className="text-muted-foreground">See how any content transforms into your personal podcast</p>
      </div>

      <Card className="relative overflow-hidden">
        <CardContent className="p-8">
          {/* Content Input Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg">Input Content</h4>
              <button onClick={startAnimation} className="text-sm text-primary hover:underline" disabled={isAnimating}>
                {isAnimating ? "Converting..." : "Try Again"}
              </button>
            </div>

            <div
              className={`
              relative p-4 border-2 border-dashed rounded-lg transition-all duration-500
              ${currentStep >= 0 && isAnimating ? "border-primary bg-primary/5" : "border-muted-foreground/30"}
            `}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`
                  p-3 rounded-lg transition-all duration-500
                  ${currentStep >= 0 && isAnimating ? "bg-primary text-primary-foreground" : "bg-muted"}
                `}
                >
                  {contentTypes[currentContent].icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{contentTypes[currentContent].name}</div>
                  <div className="text-sm text-muted-foreground">{contentTypes[currentContent].type}</div>
                </div>
                {currentStep >= 0 && isAnimating && (
                  <div className="animate-pulse">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-lg">AI Processing</h4>
              <div className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</div>
            </div>

            <Progress value={progress} className="mb-6" />

            {/* Processing Steps */}
            <div className="space-y-4">
              {conversionSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`
                    flex items-center gap-4 p-3 rounded-lg transition-all duration-500
                    ${
                      index === currentStep && isAnimating
                        ? "bg-primary/10 border border-primary/20"
                        : index < currentStep && isAnimating
                          ? "bg-muted/50"
                          : "opacity-50"
                    }
                  `}
                >
                  <div
                    className={`
                    p-2 rounded-full transition-all duration-500
                    ${
                      index === currentStep && isAnimating
                        ? step.color + " text-white animate-pulse"
                        : index < currentStep && isAnimating
                          ? "bg-green-500 text-white"
                          : "bg-muted"
                    }
                  `}
                  >
                    {index < currentStep && isAnimating ? <CheckCircle className="h-5 w-5" /> : step.icon}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{step.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {index === currentStep && isAnimating ? (
                        <span className="flex items-center gap-2">
                          {step.description}
                          <div className="flex gap-1">
                            <div
                              className="w-1 h-1 bg-current rounded-full animate-bounce"
                              style={{ animationDelay: "0ms" }}
                            />
                            <div
                              className="w-1 h-1 bg-current rounded-full animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <div
                              className="w-1 h-1 bg-current rounded-full animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                          </div>
                        </span>
                      ) : (
                        step.description
                      )}
                    </div>
                  </div>
                  {index === currentStep && isAnimating && (
                    <div className="animate-spin">
                      <Zap className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Output Section */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Generated Podcast</h4>
            <div
              className={`
              relative p-4 border rounded-lg transition-all duration-500
              ${
                currentStep >= conversionSteps.length - 1 && isAnimating
                  ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                  : "border-muted-foreground/30 opacity-50"
              }
            `}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`
                  p-3 rounded-lg transition-all duration-500
                  ${currentStep >= conversionSteps.length - 1 && isAnimating ? "bg-green-500 text-white" : "bg-muted"}
                `}
                >
                  <Headphones className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">
                    {contentTypes[currentContent].name.replace(/\.[^/.]+$/, "")} - Podcast Episode
                  </div>
                  <div className="text-sm text-muted-foreground">
                    High-quality audio • 12 min duration • Ready to listen
                  </div>
                </div>
                {currentStep >= conversionSteps.length - 1 && isAnimating && (
                  <div className="flex gap-2">
                    <div className="animate-bounce">
                      <Play className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-4 bg-green-500 rounded animate-pulse" style={{ animationDelay: "0ms" }} />
                      <div className="w-1 h-6 bg-green-500 rounded animate-pulse" style={{ animationDelay: "100ms" }} />
                      <div className="w-1 h-3 bg-green-500 rounded animate-pulse" style={{ animationDelay: "200ms" }} />
                      <div className="w-1 h-5 bg-green-500 rounded animate-pulse" style={{ animationDelay: "300ms" }} />
                      <div className="w-1 h-2 bg-green-500 rounded animate-pulse" style={{ animationDelay: "400ms" }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Floating particles effect */}
          {isAnimating && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-primary/30 rounded-full animate-float"
                  style={{
                    left: `${20 + i * 15}%`,
                    animationDelay: `${i * 0.5}s`,
                    animationDuration: "3s",
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
