"use client"

import type React from "react"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Headphones, Play, ArrowRight, CheckCircle, Shield, Github } from 'lucide-react'
import { UploadFlowCard } from "@/components/animation"

import Link from "next/link"
export default function Page() {
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
    return () => {
      document.documentElement.style.scrollBehavior = '';
    };
  }, []);
  const features = [
    {
      title: "Upload",
      description: "Upload any PDF and watch our AI transform it into engaging audio content in minutes.",
      video: "/videos/upload.mp4",
    },
    {
      title: "Customizable Script",
      description: "Add any optional requirements for script generation.",
      video: "/videos/requirements.mp4",
    },
    {
      title: "Multi model and output type",
      description: "Select from multiple models and output types.",
      video: "/videos/model_op.mp4",
    }
  ]
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="w-full border-b backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container max-w-screen-xl mx-auto flex items-center justify-center sm:justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Headphones className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl sm:text-2xl font-orbitron">
              Pod
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-6 items-center">
            <a
              className="text-sm font-orbitron text-muted-foreground hover:text-foreground flex items-center gap-1 duration-300 ease-in-out"
              href="https://github.com/sushilbang/podcast-pro"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
              <Github className="h-4 w-4 transition-transform duration-300 ease-in-out" />
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button size="sm" className="hidden sm:flex group">
              <Link href="/login" className="flex items-center gap-2 font-orbitron">
                Get Started
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 sm:py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-black/[0.02] bg-[size:60px_60px]" />
          <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 relative">
            <div className="grid gap-8 items-center">
              {/* Text Section */}
              <div className="flex flex-col justify-center items-center space-y-6 text-center">
                <div className="space-y-4">
                  <h1 className="text-3xl sm:text-4xl xl:text-5xl font-bold tracking-tight leading-tight font-orbitron">
                    Turn Any Content Into Your Personal Podcast
                  </h1>
                  <p className="text-muted-foreground mx-auto lg:mx-0 text-base sm:text-lg font-geist-sans">
                    Transform PDFs into high-quality, personalized podcasts with AI-generated voices. Learn on the go
                    with content tailored to your preferences and learning style.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8 group shadow-lg">
                    <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                    <Link href="/login" className="font-orbitron">Start Creating Free</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base sm:text-lg px-6 sm:px-8 group bg-transparent"
                  >
                    <Link href="/demo" className="flex items-center gap-2 font-orbitron">
                      Watch Demo
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center justify-center lg:justify-start gap-6 pt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-orbitron">Free to start</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="font-orbitron">Secure & Private</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Features Section - Updated for better responsiveness */}
        <section id="how-it-works" className="w-full py-12 sm:py-16 lg:py-24">
          <div className="container max-w-screen-xl mx-auto px-4 sm:px-6">
            <h1 className="text-3xl lg:text-5xl font-orbitron text-left w-full py-8">How it works</h1>
            <div className="space-y-12">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className={`flex flex-col gap-8 sm:gap-10 lg:gap-12 xl:gap-20 lg:grid lg:grid-cols-2 items-center lg:border-6 border-border/50 p-4 sm:p-6 lg:p-8 rounded-xl ${index % 2 === 1 ? 'lg:grid-flow-col-dense' : ''
                    }`}
                >
                  {/* Content */}
                  <div className={`space-y-4 text-center lg:text-left order-2 lg:order-1 ${index % 2 === 1 ? 'lg:col-start-2 lg:order-2' : ''}`}>
                    <h3 className="text-xl sm:text-2xl lg:text-3xl tracking-tight font-orbitron">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground text-sm sm:text-base lg:text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                      {feature.description}
                    </p>
                  </div>

                  {/* Video */}
                  <div className={`w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-none mx-auto order-1 lg:order-2 ${index % 2 === 1 ? 'lg:col-start-1 lg:order-1' : ''}`}>
                    <div className="relative rounded-xl overflow-hidden">
                      <video
                        className="w-full h-auto"
                        autoPlay
                        muted
                        loop
                        playsInline
                        poster={`/placeholder.svg?height=300&width=500&text=Demo+${index + 1}`}
                      >
                        <source src={feature.video} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t bg-muted/30">
        <div className="flex items-center gap-2">
          <Headphones className="h-6 w-6 text-primary" />
          <span className="text-sm font-orbitron">Pod</span>
        </div>
        <p className="text-xs text-muted-foreground sm:ml-auto font-orbitron">© 2024 Pod. All rights reserved.</p>
      </footer>
    </div>
  )
}