"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Headphones,
  Zap,
  Clock,
  Star,
  Play,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import { Video } from "@/components/ui/video";
import Link from "next/link";

export default function Page() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="w-full border-b backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container max-w-screen-xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2">
            <Headphones className="h-6 w-6 text-primary" />
            <span className="text-xl sm:text-2xl font-bold">Pod</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-6 items-center">
            <a
              className="text-sm font-medium hover:text-primary transition-colors"
              href="#how-it-works"
            >
              How It Works
            </a>
            <a
              className="text-sm font-medium hover:text-primary transition-colors"
              href="/demo"
            >
              Demo
            </a>
            <a
              className="text-sm font-medium flex items-center gap-1 hover:text-yellow-500 transition-colors"
              href="https://github.com/sushilbang/podcast-pro"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Star className="h-4 w-4" />
              GitHub
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button size="sm" className="hidden sm:flex">
              <Link href="/login">Get Started</Link>
            </Button>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t bg-background">
            <nav className="container mx-auto px-4 py-4 space-y-4">
              <a
                className="block text-sm font-medium hover:text-primary transition-colors"
                href="#features"
              >
                Features
              </a>
              <a
                className="block text-sm font-medium hover:text-primary transition-colors"
                href="#how-it-works"
              >
                How It Works
              </a>
              <a
                className="block text-sm font-medium hover:text-primary transition-colors"
                href="/demo"
              >
                Demo
              </a>
              <Button size="sm" className="w-full">
                <Link href="/login">Get Started</Link>
              </Button>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 sm:py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
          <div className="container max-w-screen-xl mx-auto px-4 sm:px-6">
            <div className="grid gap-8 lg:gap-12 lg:grid-cols-2 items-center">
              {/* Text Section */}
              <div className="flex flex-col justify-center space-y-6 text-center lg:text-left order-2 lg:order-1">
                <div className="space-y-4">
                  <Badge
                    variant="secondary"
                    className="mx-auto lg:mx-0 w-fit animate-pulse"
                  >
                    🎧 AI-Powered Content Transformation
                  </Badge>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight">
                    Turn Any Content Into Your Personal Podcast
                  </h1>
                  <p className="text-muted-foreground max-w-2xl mx-auto lg:mx-0 text-base sm:text-lg leading-relaxed">
                    Transform PDFs into
                    high-quality, personalized podcasts. Learn on the go with
                    AI-generated audio content tailored to your preferences.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Button
                    size="lg"
                    className="text-base sm:text-lg px-6 sm:px-8 group"
                  >
                    <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5 group-hover:scale-110 transition-transform" />
                    Start Creating Free
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-base sm:text-lg px-6 sm:px-8 group bg-transparent"
                  >
                    <Link href="/demo">Watch Demo</Link>
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>

              {/* Card Section */}
              <div className="flex items-center justify-center order-1 lg:order-2">
                <div className="relative w-full max-w-sm lg:max-w-md">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl animate-pulse"></div>
                  <Card className="relative z-10 shadow-xl">
                    <CardHeader className="text-center pb-4">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Headphones className="h-8 w-8 text-primary" />
                      </div>
                      <CardTitle className="text-lg">
                        Your Content, Your Voice
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Upload any document and get a personalized podcast in
                        minutes
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <FileText className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm truncate">
                          research-paper.pdf
                        </span>
                      </div>
                      <div className="flex items-center justify-center py-2">
                        <div className="flex items-center gap-2 text-primary">
                          <Zap className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Converting...
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                        <Play className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm font-medium">
                          Ready to listen!
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Demo Video Section */}
        <section
          id="how-it-works"
          className="w-full py-12 sm:py-16 lg:py-24 bg-gradient-to-b from-muted/30 to-background"
        >
          <div className="container max-w-screen-xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="space-y-4 max-w-3xl">
                <Badge variant="secondary">See It In Action</Badge>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
                  Watch How It Works
                </h2>
                <p className="text-muted-foreground text-base sm:text-lg lg:text-xl leading-relaxed">
                  See how easy it is to transform any content into a
                  personalized podcast. From upload to audio in just minutes.
                </p>
              </div>
              <Video />
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-6">
                <Button size="lg" className="text-base sm:text-lg px-6 sm:px-8">
                  <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  <Link href="/login">Try it now</Link>
                </Button>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Average conversion: 2-3 minutes</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-16 sm:py-20 lg:py-24 bg-slate-800 text-primary-foreground relative overflow-hidden">
          <div className="container max-w-screen-xl mx-auto px-4 sm:px-6 relative z-10">
            <div className="flex flex-col items-center justify-center space-y-8 text-center">
              <div className="space-y-4 max-w-4xl">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-tight">
                  Ready to Transform Your Learning?
                </h2>
                <p className="text-primary-foreground/90 text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto">
                  Join learners who are already using Pod to
                  consume content more efficiently. Start your journey today.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button
                  size="lg"
                  variant="secondary"
                  className="text-base sm:text-lg px-8 py-3 h-auto font-semibold shadow-lg hover:cursor-pointer hover:shadow-xl transition-all duration-300"
                >
                  <Play className="mr-2 h-5 w-5" />
                  <Link href="/login">Start</Link>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <div className="flex items-center gap-2">
          <Headphones className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium">Pod</span>
        </div>
        <p className="text-xs text-muted-foreground sm:ml-auto">
          © 2024 Pod. All rights reserved.
        </p>
        {/* <nav className="flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
            Privacy Policy
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/terms">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/contact">
            Contact
          </Link>
        </nav> */}
      </footer>
    </div>
  );
}
