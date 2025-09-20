"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Headphones, FileText, Play } from "lucide-react"

export function UploadFlowCard() {
  const [stage, setStage] = useState<"processing" | "ready">("processing")

  // simulate stage change after a few seconds
  useEffect(() => {
    const timer = setTimeout(() => setStage("ready"), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="hidden lg:block order-2">
      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl"></div>
        <Card className="relative z-10 border border-border/50 bg-background/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-lg border border-primary/20 bg-primary/5">
              <Headphones className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg font-orbitron tracking-wide">
              Content → Audio
            </CardTitle>
            <CardDescription className="text-sm font-geist-mono text-muted-foreground/80">
              Upload. Process. Listen.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Upload */}
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 border border-border/50 rounded-lg">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-geist-mono">research.pdf</span>
                <Badge variant="outline" className="text-xs font-geist-mono ml-auto">
                  480kB
                </Badge>
              </div>
            </div>

            {/* Animated Stage */}
            <AnimatePresence mode="wait">
              {stage === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-150"></div>
                      <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-300"></div>
                    </div>
                  </div>
                </motion.div>
              )}

              {stage === "ready" && (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, type: "spring" }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-3 p-3 border border-primary/20 rounded-lg bg-primary/5">
                    <Play className="h-4 w-4 text-primary" />
                    <span className="text-sm font-geist-mono">ready</span>
                    <Badge variant="secondary" className="text-xs font-geist-mono ml-auto">
                      12:34
                    </Badge>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
