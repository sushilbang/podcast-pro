"use client";

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
  Download,
} from "lucide-react";
import Link from "next/link";
import ConversionAnimation from "@/components/ui/conversion-animation";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="w-full border-b">
  <div className="container max-w-screen-xl mx-auto flex flex-wrap items-center justify-between px-4 sm:px-6 py-4">
    <Link className="flex items-center gap-2" href="/">
      <span className="text-2xl font-bold">Pod🎧</span>
    </Link>

    <nav className="hidden md:flex gap-6">
      <Link
        className="text-sm font-medium hover:text-primary transition-colors"
        href="#features"
      >
        Features
      </Link>
      <Link
        className="text-sm font-medium hover:text-primary transition-colors"
        href="#how-it-works"
      >
        How It Works
      </Link>
      <Link
        className="text-sm font-medium hover:text-primary transition-colors"
        href="#demo"
      >
        Demo
      </Link>
    </nav>

    <div className="flex items-center gap-2 ml-auto md:ml-0">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/login">Sign In</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/signup">Get Started</Link>
      </Button>
    </div>
  </div>
</header>


      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-8 md:py-16 lg:py-20 xl:py-24 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
  <div className="container max-w-screen-xl mx-auto px-4 sm:px-6">
    <div className="flex flex-col-reverse lg:grid lg:grid-cols-[1fr_400px] xl:grid-cols-[1fr_600px] gap-8 lg:gap-12">
      {/* Text Section */}
      <div className="flex flex-col justify-center space-y-6 text-center lg:text-left">
        <div className="space-y-3">
          <Badge variant="secondary" className="mx-auto lg:mx-0 w-fit">
            🎧 AI-Powered Content Transformation
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold tracking-tight">
            Turn Any Content Into Your Personal <span className="text-primary">Podcast</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto lg:mx-0 text-base sm:text-lg md:text-xl">
            Transform PDFs, articles, videos, and documents into high-quality, personalized podcasts. Learn on
            the go with AI-generated audio content tailored to your preferences.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
          <Button size="lg" className="text-lg px-6" asChild>
            <Link href="/signup">
              <Play className="mr-2 h-5 w-5" />
              Start Creating Free
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="text-lg px-6" asChild>
            <Link href="#demo">Watch Demo</Link>
          </Button>
        </div>
        <div className="text-sm text-muted-foreground flex flex-wrap justify-center lg:justify-start gap-3">
          <span>• 10+ podcasts created</span>
          <span>• No credit card required</span>
        </div>
      </div>

      {/* Card Section */}
      <div className="flex items-center justify-center">
        <div className="relative w-full max-w-sm md:max-w-md">

          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-3xl"></div>
          <Card className="relative z-10">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Headphones className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Your Content, Your Voice</CardTitle>
              <CardDescription>
                Upload any document and get a personalized podcast in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-sm truncate">research-paper.pdf</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-2 text-primary">
                  <Zap className="h-4 w-4" />
                  <span className="text-sm font-medium">Converting...</span>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-primary/10 rounded-lg">
                <Play className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">Ready to listen!</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</section>


        {/* Demo Animation Section */}
        <section
          id="demo"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted/30"
        >
          <div className="container max-w-screen-xl mx-auto px-4 sm:px-6">

            <ConversionAnimation />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container max-w-screen-xl mx-auto px-4 sm:px-6">

            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="secondary">Features</Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything You Need for Audio Learning
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Powerful features designed to transform how you consume and
                  learn from content.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Multiple Content Types</CardTitle>
                  <CardDescription>
                    Support for PDFs, articles, videos, web pages, and more.
                    Upload any content and get it converted.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>AI-Powered Conversion</CardTitle>
                  <CardDescription>
                    Advanced AI extracts key insights and creates engaging,
                    natural-sounding podcast episodes.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Lightning Fast</CardTitle>
                  <CardDescription>
                    Get your podcast ready in minutes, not hours. Perfect for
                    busy professionals and students.
                  </CardDescription>
                </CardHeader>
              </Card>
              {/* <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Smartphone className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Mobile Ready</CardTitle>
                  <CardDescription>
                    Listen anywhere with our mobile app. Download episodes for offline listening during commutes.
                  </CardDescription>
                </CardHeader>
              </Card> */}
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Download className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Export & Share</CardTitle>
                  <CardDescription>
                    Download your podcasts or share them with colleagues,
                    friends, and study groups.
                  </CardDescription>
                </CardHeader>
              </Card>
              <Card className="relative overflow-hidden">
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Premium Quality</CardTitle>
                  <CardDescription>
                    High-quality audio with natural voices and perfect pacing
                    for an enjoyable listening experience.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section
          id="how-it-works"
          className="w-full py-12 md:py-24 lg:py-32 bg-muted/50"
        >
          <div className="container max-w-screen-xl mx-auto px-4 sm:px-6">

            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge variant="secondary">How It Works</Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  From Content to Podcast in 3 Simple Steps
                </h2>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-bold">Upload Your Content</h3>
                <p className="text-muted-foreground">
                  Drag and drop PDFs, paste article URLs, or upload videos. We
                  support all major content formats.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-bold">AI Processing</h3>
                <p className="text-muted-foreground">
                  Our AI analyzes your content, extracts key points, and creates
                  an engaging podcast script.
                </p>
              </div>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-bold">Listen & Learn</h3>
                <p className="text-muted-foreground">
                  Your personalized podcast is ready! Listen online, download,
                  or share with others.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container max-w-screen-xl mx-auto px-4 sm:px-6">

            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Ready to Transform Your Learning?
                </h2>
                <p className="mx-auto max-w-[600px] text-primary-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Join thousands of learners who are already using Pod to
                  consume content more efficiently.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                {/* <form className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    className="max-w-lg flex-1 bg-primary-foreground text-primary"
                  />
                  <Button type="submit" variant="secondary">
                    Get Started
                  </Button>
                </form> */}
                <p className="text-xs text-primary-foreground/60">
                  Start your free trial. No credit card required.
                </p>
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
