"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import ClientOnly from "@/components/ui/client-only"
import Header from "@/components/layout/header-block"
import AudioPlayer from "@/components/ui/AudioPlayer"
import ConversionAnimation from "@/components/dashboard/ConversionAnimation"
import WelcomeDialog from "@/components/dashboard/WelcomeDialog"
import { Loader2, Download } from "lucide-react"
import type { User } from "@supabase/supabase-js"

const API_URL = process.env.NEXT_PUBLIC_API_URL!
const MAX_SIZE_MB = 10

type Podcast = {
  id: number
  status: "pending" | "processing" | "complete" | "failed"
  original_file_url: string | null
  final_podcast_url: string | null
  created_at: string
}

export default function DashboardClient({ initialPodcasts }: { initialPodcasts: Podcast[] }) {
  const supabase = createClient()
  const router = useRouter()

  // Authentication state
  const [user, setUser] = useState<User | null>(null)
  const [isAuthLoading, setIsAuthLoading] = useState(true)

  // Component state
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [podcasts, setPodcasts] = useState<Podcast[]>(initialPodcasts)
  const [uploadStatus, setUploadStatus] = useState("")
  const [currentlyPlaying, setCurrentlyPlaying] = useState<Podcast | null>(null)
  const [isFetchingPodcasts, setIsFetchingPodcasts] = useState(true)
  const [dragOver, setDragOver] = useState(false)
  const [fileSizeMB, setFileSizeMB] = useState<number>(0)
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false)

  // Authentication effect
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        // console.log("Client - Initializing auth...")

        // Get current session
        const {
          data: { session }
        } = await supabase.auth.getSession()
        // console.log("Client - Session check:", {
        //   hasSession: !!session,
        //   hasUser: !!session?.user,
        //   error: sessionError?.message,
        // })

        if (!isMounted) return

        if (session?.user) {
          // console.log("Client - User found:", session.user.email)
          setUser(session.user)
        } else {
          // console.log("Client - No session, redirecting to login")
          router.replace("/login")
          return
        }
      } catch (error) {
        console.error("Client - Auth initialization error:", error)
        if (isMounted) {
          router.replace("/login")
          return
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // console.log("Client - Auth state change:", event, { hasSession: !!session, hasUser: !!session?.user })

      if (!isMounted) return

      if (event === "SIGNED_OUT" || !session?.user) {
        // console.log("Client - User signed out or no user, redirecting")
        setUser(null)
        // Clear local storage on logout
        localStorage.removeItem("hasSeenWelcomeMessage")
        router.replace("/login")
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        // console.log("Client - User signed in or token refreshed")
        setUser(session.user)
        setIsAuthLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, router])

  // Welcome message effect
  useEffect(() => {
    if (!user) return
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcomeMessage")
    if (!hasSeenWelcome) setShowWelcomeDialog(true)
  }, [user])

  // Fetch podcasts effect
  useEffect(() => {
    if (!user) return

    const fetchPodcasts = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          // console.log("Client - No session for podcast fetch")
          return
        }

        const token = session.access_token
        const response = await fetch(`${API_URL}/podcasts/`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (response.ok) {
          const userPodcasts: Podcast[] = await response.json()
          setPodcasts(userPodcasts)
        } else {
          console.error("Client - Failed to fetch podcasts:", response.status)
          toast.error("Could not fetch your existing podcasts.")
        }
      } catch (error) {
        console.error("Client - Podcast fetch error:", error)
        toast.error("Failed to connect to the server.")
      } finally {
        setIsFetchingPodcasts(false)
      }
    }

    fetchPodcasts()
  }, [user, supabase])

  // Polling effect for podcast status updates
  useEffect(() => {
    const processingPodcasts = podcasts.filter(
      (p) => p.status === "pending" || p.status === "processing"
    );
    if (processingPodcasts.length === 0) {
      return;
    }

    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      let hasChanges = false;
      
      const newPodcastsState = [...podcasts];

      await Promise.all(
        processingPodcasts.map(async (podcast) => {
          try {
            const res = await fetch(`${API_URL}/podcasts/${podcast.id}`, {
              headers: { Authorization: `Bearer ${session.access_token}` },
            });

            if (res.ok) {
              const updatedPodcast: Podcast = await res.json();
              
              const podcastIndex = newPodcastsState.findIndex(p => p.id === updatedPodcast.id);

              if (podcastIndex !== -1 && newPodcastsState[podcastIndex].status !== updatedPodcast.status) {
                newPodcastsState[podcastIndex] = updatedPodcast;
                hasChanges = true;

                if (updatedPodcast.status === "complete") {
                    toast.success(`Podcast #${updatedPodcast.id} is ready!`);
                } else if (updatedPodcast.status === "failed") {
                    toast.error(`Podcast #${updatedPodcast.id} failed to process.`);
                }
              }
            }
          } catch (err) {
            console.error(`Polling error for podcast #${podcast.id}:`, err);
          }
        })
      );
      if (hasChanges) {
        setPodcasts(newPodcastsState);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [podcasts, supabase.auth]);

  // Handle file selection
  const handleFileSelect = (file?: File) => {
    if (!file) return
    if (file.type !== "application/pdf") return toast.error("Only PDF files are accepted.")
    const size = file.size / (1024 * 1024)
    if (size > MAX_SIZE_MB) return toast.error(`File must be smaller than ${MAX_SIZE_MB}MB.`)
    setSelectedFile(file)
    setFileSizeMB(size)
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedFile) return toast.error("No file selected.")
    if (!user) return toast.error("You must be logged in to upload.")

    setIsUploading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Session expired. Please log in again.")
        router.replace("/login")
        return
      }

      setUploadStatus("Getting upload link...")
      const presignRes = await fetch(`${API_URL}/uploads/sign-url/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: selectedFile.name }),
      })

      if (!presignRes.ok) {
        throw new Error("Failed to get upload URL")
      }

      const { url, fields } = await presignRes.json()
      const formData = new FormData()
      Object.entries(fields).forEach(([k, v]) => formData.append(k, String(v)))
      formData.append("file", selectedFile)

      setUploadStatus("Uploading to S3...")
      const uploadRes = await fetch(url, { method: "POST", body: formData })

      if (!uploadRes.ok) {
        throw new Error("Failed to upload file")
      }

      setUploadStatus("Creating podcast job...")
      const createRes = await fetch(`${API_URL}/podcasts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ original_file_url: `${url}${fields.key}` }),
      })

      if (!createRes.ok) {
        throw new Error("Failed to create podcast")
      }

      const newPodcast = await createRes.json()
      setPodcasts((prev) => [newPodcast, ...prev])
      toast.success("Podcast is being created!")
    } catch (err) {
      console.error("Client - Upload error:", err)
      toast.error("Something went wrong during upload.")
    } finally {
      setIsUploading(false)
      setUploadStatus("")
      setSelectedFile(null)
      setFileSizeMB(0)
    }
  }

  // Show loading state while checking authentication
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // Show loading state if no user (will redirect)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-lg">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-28">
      <Header />
      <main className="flex flex-col items-center p-4 sm:p-8 md:p-12">
        <div className="z-10 w-full max-w-5xl">
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Create a New Podcast</h2>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-4 max-w-lg mx-auto">
              <div
                className={`relative border-2 border-dashed p-6 rounded-lg w-full text-center transition-all duration-300 ${
                  dragOver ? "border-primary bg-primary/10" : "border-gray-300 dark:border-gray-600"
                }`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  handleFileSelect(e.dataTransfer.files?.[0])
                }}
              >
                <Input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="file-upload"
                  disabled={isUploading}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <p className="text-muted-foreground mb-2">Drag & drop your PDF here or click to browse</p>
                  <p className="text-xs text-muted-foreground">(Max {MAX_SIZE_MB}MB)</p>
                </label>
                {selectedFile && (
                  <div className="mt-4 text-sm font-medium text-foreground">
                    Selected: {selectedFile.name} ({fileSizeMB.toFixed(2)} MB)
                  </div>
                )}
              </div>
              <Button type="submit" disabled={!selectedFile || isUploading}>
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploadStatus}
                  </>
                ) : (
                  "Create Podcast"
                )}
              </Button>
            </form>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-center mb-8">Your Podcasts</h2>
            <div className="space-y-4">
              {isFetchingPodcasts ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="flex items-center justify-center space-x-2 py-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                  <p>Loading your podcasts...</p>
                </div>
              ) : podcasts.length > 0 ? (
                podcasts.map((podcast) => (
                  <Card key={podcast.id}>
                    <CardHeader>
                      <CardTitle>Podcast #{podcast.id}</CardTitle>
                      <ClientOnly>
                        <CardDescription>Created on: {new Date(podcast.created_at).toLocaleString()}</CardDescription>
                      </ClientOnly>
                    </CardHeader>
                    <CardContent>
                      {podcast.status === "complete" ? (
                        <>
                          <p>
                            Status: <span className="font-semibold capitalize text-green-600">{podcast.status}</span>
                          </p>
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Button onClick={() => setCurrentlyPlaying(podcast)}>Listen Now</Button>
                            <Button asChild variant="outline">
                              <a href={podcast.final_podcast_url || "#"} download={`Podcast_#${podcast.id}.mp3`}>
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </a>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <ConversionAnimation status={podcast.status} />
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-500">You haven&apos;t created any podcasts yet.</p>
              )}
            </div>
          </section>
        </div>
      </main>

      {currentlyPlaying && <AudioPlayer podcast={currentlyPlaying} onClose={() => setCurrentlyPlaying(null)} />}

      <WelcomeDialog
        isOpen={showWelcomeDialog}
        onClose={() => {
          localStorage.setItem("hasSeenWelcomeMessage", "true")
          setShowWelcomeDialog(false)
        }}
      />
    </div>
  )
}
