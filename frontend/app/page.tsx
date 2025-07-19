"use client";

import type React from "react";

import { useState, useEffect, useRef } from "react";
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
  Volume2,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Brain,
  Globe,
  Menu,
  X,
} from "lucide-react";
import { Video } from "@/components/ui/video";
import Link from "next/link";
// import Image from "next/image";

// Types
interface AnimatedFeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  demo?: React.ReactNode;
  delay?: number;
}

// Animated Feature Card Component
function AnimatedFeatureCard({
  icon: Icon,
  title,
  description,
  demo,
  delay = 0,
}: AnimatedFeatureCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <Card
      ref={cardRef}
      className={`relative overflow-hidden group cursor-pointer transition-all duration-700 transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } hover:scale-105 hover:shadow-xl border-2 hover:border-primary/20`}
      onMouseEnter={() => setShowDemo(true)}
      onMouseLeave={() => setShowDemo(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <CardHeader className="relative z-10">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-all duration-300">
          <Icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform duration-300" />
        </div>
        <CardTitle className="group-hover:text-primary transition-colors duration-300 text-lg">
          {title}
        </CardTitle>
        <CardDescription className="text-sm leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      {demo && (
        <CardContent className="relative z-10">
          <div
            className={`transition-all duration-500 ${
              showDemo ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
            } overflow-hidden`}
          >
            {demo}
          </div>
        </CardContent>
      )}

      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
    </Card>
  );
}

// File Upload Demo Component
function FileUploadDemo() {
  const [stage, setStage] = useState(0);
  const stages = ["idle", "uploading", "processing", "complete"];

  useEffect(() => {
    const interval = setInterval(() => {
      setStage((prev) => (prev + 1) % stages.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-2 bg-muted rounded">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="text-xs">document.pdf</span>
        </div>
        {stage >= 3 && <CheckCircle className="h-4 w-4 text-green-500" />}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div
          className="bg-primary h-1 rounded-full transition-all duration-1000"
          style={{ width: `${(stage + 1) * 25}%` }}
        ></div>
      </div>
      <p className="text-xs text-muted-foreground capitalize">
        {stages[stage]}...
      </p>
    </div>
  );
}

// AI Processing Demo Component
function AIProcessingDemo() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
        <Brain className="h-4 w-4 text-blue-500 animate-pulse" />
        <span className="text-xs">Analyzing content{dots}</span>
      </div>
      <div className="flex items-center gap-2 p-2 bg-purple-50 rounded">
        <Sparkles className="h-4 w-4 text-purple-500 animate-pulse" />
        <span className="text-xs">Generating script{dots}</span>
      </div>
      <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
        <Volume2 className="h-4 w-4 text-green-500 animate-bounce" />
        <span className="text-xs">Creating audio{dots}</span>
      </div>
    </div>
  );
}

// Speed Demo Component
function SpeedDemo() {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && time < 180) {
      // 3 minutes
      interval = setInterval(() => {
        setTime((time) => time + 1);
      }, 50);
    } else if (time >= 180) {
      setIsRunning(false);
      setTimeout(() => {
        setTime(0);
        setIsRunning(true);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, time]);

  useEffect(() => {
    setIsRunning(true);
  }, []);

  return (
    <div className="text-center space-y-2">
      <div className="text-2xl font-bold text-primary">
        {Math.floor(time / 60)}:{(time % 60).toString().padStart(2, "0")}
      </div>
      <div className="text-xs text-muted-foreground">
        Average conversion time
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-100"
          style={{ width: `${(time / 180) * 100}%` }}
        ></div>
      </div>
    </div>
  );
}

export default function Page() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="w-full border-b backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="container max-w-screen-xl mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <div className="flex items-center gap-2">
            <Headphones className="h-6 w-6 text-primary" />
            {/* <Image src="/images/POD.png" alt="Podcast Logo" width={40} height={40} /> */}
            <span className="text-xl sm:text-2xl font-bold">Pod</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex gap-6 items-center">
            <a
              className="text-sm font-medium hover:text-primary transition-colors"
              href="#features"
            >
              Features
            </a>
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
                    Transform PDFs, articles, videos, and documents into
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

                {/* Stats Row */}
                {/* <div className="grid grid-cols-3 gap-4 sm:gap-6 pt-4 max-w-md mx-auto lg:mx-0">
                  <StatsCounter end={1000} label="Podcasts Created" suffix="+" />
                  <StatsCounter end={50} label="Hours Saved" suffix="K+" />
                  <StatsCounter end={98} label="Satisfaction" suffix="%" />
                </div> */}
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

        {/* Features Section */}
        <section
          id="features"
          className="w-full py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-background via-muted/20 to-background"
        >
          <div className="container max-w-screen-xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
              <Badge variant="secondary" className="animate-pulse">
                Features
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight max-w-4xl">
                Everything You Need for Audio Learning
              </h2>
              <p className="max-w-3xl text-muted-foreground text-base sm:text-lg lg:text-xl leading-relaxed">
                Powerful features designed to transform how you consume and
                learn from content.
              </p>
            </div>

            <div className="grid gap-6 lg:gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
              <AnimatedFeatureCard
                icon={FileText}
                title="Multiple Content Types"
                description="Support for PDFs, articles, videos, web pages, and more. Upload any content and get it converted."
                demo={<FileUploadDemo />}
                delay={0}
              />

              <AnimatedFeatureCard
                icon={Zap}
                title="AI-Powered Conversion"
                description="Advanced AI extracts key insights and creates engaging, natural-sounding podcast episodes."
                demo={<AIProcessingDemo />}
                delay={200}
              />

              <AnimatedFeatureCard
                icon={Clock}
                title="Lightning Fast"
                description="Get your podcast ready in minutes, not hours. Perfect for busy professionals and students."
                demo={<SpeedDemo />}
                delay={400}
              />

              <AnimatedFeatureCard
                icon={Download}
                title="Export & Share"
                description="Download your podcasts or share them with colleagues, friends, and study groups."
                demo={
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" variant="outline">
                      <Download className="h-3 w-3 mr-1" />
                      MP3
                    </Button>
                    <Button size="sm" variant="outline">
                      <Globe className="h-3 w-3 mr-1" />
                      Share
                    </Button>
                  </div>
                }
                delay={600}
              />

              <AnimatedFeatureCard
                icon={Star}
                title="Premium Quality"
                description="High-quality audio with natural voices and perfect pacing for an enjoyable listening experience."
                demo={
                  <div className="flex items-center justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className="h-4 w-4 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                }
                delay={800}
              />
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
                  Join thousands of learners who are already using Pod to
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
                  <Link href="/login">Start Free Trial</Link>
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                {/* <Button
                  size="lg"
                  variant="outline"
                  className="text-base sm:text-lg px-8 py-3 h-auto border-primary-foreground/30 text-primary-foreground hover:text-white hover:bg-primary-foreground/10 hover:border-primary-foreground/50 transition-all duration-300 bg-transparent"
                >
                  <Link href="/pricing">Pricing</Link>
                </Button> */}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-sm text-primary-foreground/80">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Cancel anytime</span>
                </div>
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
