// frontend/app/dashboard/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import ClientOnly from "@/components/ui/client-only";
import Header from "@/components/layout/header-block";
import AudioPlayer from "@/components/ui/AudioPlayer";
import ConversionAnimation from "@/components/dashboard/ConversionAnimation";
import WelcomeDialog from "@/components/dashboard/WelcomeDialog";
import { toast } from "sonner";
import { Loader2, Download } from "lucide-react";

const API_URL = "http://127.0.0.1:8000";

type Podcast = {
  id: number;
  status: "pending" | "processing" | "complete" | "failed";
  original_file_url: string | null;
  final_podcast_url: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState<Podcast | null>(
    null
  );
  const [isFetchingPodcasts, setIsFetchingPodcasts] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [fileSizeMB, setFileSizeMB] = useState<number>(0);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);

  const MAX_SIZE_MB = 10;

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) router.push("/login");
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcomeMessage');
    if (!hasSeenWelcome) {
      setShowWelcomeDialog(true);
    }
  }, []);

  useEffect(() => {
    const fetchPodcasts = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const token = session.access_token;
        try {
          const response = await fetch(`${API_URL}/podcasts/`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.ok) {
            const userPodcasts: Podcast[] = await response.json();
            setPodcasts(userPodcasts);
          } else {
            toast.error("Could not fetch your existing podcasts.");
          }
        } catch (error) {
          toast.error("Failed to connect to the server.");
        } finally {
          setIsFetchingPodcasts(false);
        }
      }
    };
    fetchPodcasts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const processingPodcasts = podcasts.filter(
        (p) => p.status === "pending" || p.status === "processing"
      );
      if (processingPodcasts.length === 0) return;

      processingPodcasts.forEach(async (podcast) => {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) return;
        try {
          const response = await fetch(`${API_URL}/podcasts/${podcast.id}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (response.ok) {
            const updatedPodcast: Podcast = await response.json();
            if (updatedPodcast.status !== podcast.status) {
              setPodcasts((prev) =>
                prev.map((p) =>
                  p.id === updatedPodcast.id ? updatedPodcast : p
                )
              );
              if (updatedPodcast.status === "complete") {
                toast.success(`Podcast #${updatedPodcast.id} is ready!`);
              } else if (updatedPodcast.status === "failed") {
                toast.error(`Podcast #${updatedPodcast.id} failed to process. Most likely the API limit was reached. Service will be back once the limit resets.`);
              }
            }
          }
        } catch (error) {
          console.error("Error polling for podcast status:", error);
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [podcasts]);

  const handleFileSelect = (file: File | undefined) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Invalid File Type", {
        description: "Only PDF files are accepted.",
      });
      return;
    }

    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > MAX_SIZE_MB) {
      toast.error("File Too Large", {
        description: `Your file must be smaller than ${MAX_SIZE_MB}MB.`,
      });
      return;
    }

    setSelectedFile(file);
    setFileSizeMB(sizeInMB);
  };

  const handleWelcomeDialogClose = () => {
    localStorage.setItem('hasSeenWelcomeMessage', 'true');
    setShowWelcomeDialog(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error("No file selected.");
      return;
    }

    setIsUploading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Authentication Error", {
        description: "You must be logged in to create a podcast.",
      });
      setIsUploading(false);
      return;
    }
    const token = session.access_token;

    try {
      setUploadStatus("Getting upload link...");
      const presignedUrlResponse = await fetch(`${API_URL}/uploads/sign-url/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: selectedFile.name }),
      });
      if (!presignedUrlResponse.ok)
        throw new Error("Could not get a secure upload link from the server.");
      const { url, fields } = await presignedUrlResponse.json();

      setUploadStatus("Uploading to S3...");
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append("file", selectedFile);
      const uploadResponse = await fetch(url, {
        method: "POST",
        body: formData,
      });
      if (!uploadResponse.ok)
        throw new Error("File upload failed. Please try again.");

      setUploadStatus("Creating podcast job...");
      const createPodcastResponse = await fetch(`${API_URL}/podcasts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ original_file_url: `${url}${fields.key}` }),
      });

      if (!createPodcastResponse.ok) {
        const errorData = await createPodcastResponse.json();
        if (createPodcastResponse.status === 503) {
          toast.error("Service Temporarily Unavailable", {
            description: errorData.detail,
          });
        } else if (createPodcastResponse.status === 429) {
            toast.error("Limit Reached", {
              description: errorData.detail,
            });
        } else {
          // Handle all other errors
          throw new Error(errorData.detail || "Server failed to start the podcast job.");
        }
        return; 
      }

      const newPodcast: Podcast = await createPodcastResponse.json();
      setPodcasts((prev) => [newPodcast, ...prev]);
      toast.success("Your new podcast is being created!");
    } catch (error: any) {
      toast.error("Upload Process Failed", { description: error.message });
    } finally {
      setIsUploading(false);
      setUploadStatus("");
      setSelectedFile(null);
      setFileSizeMB(0);
      const fileInput = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-28">
      <Header />
      <main className="flex flex-col items-center p-4 sm:p-8 md:p-12">
        <div className="z-10 w-full max-w-5xl">
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">
              Create a New Podcast
            </h2>
            <form
              onSubmit={handleSubmit}
              className="flex flex-col space-y-4 max-w-lg mx-auto"
            >
              <div
                className={`relative border-2 border-dashed p-6 rounded-lg w-full text-center transition-all duration-300 ${
                  dragOver
                    ? "border-primary bg-primary/10"
                    : "border-gray-300 dark:border-gray-600"
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  handleFileSelect(e.dataTransfer.files?.[0]);
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
                  <p className="text-muted-foreground mb-2">
                    Drag & drop your PDF here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    (Max {MAX_SIZE_MB}MB)
                  </p>
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
            <h2 className="text-3xl font-bold text-center mb-8">
              Your Podcasts
            </h2>
            <div className="space-y-4">
              {isFetchingPodcasts ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="flex items-center justify-center space-x-2 py-4">
                      <span className="loading loading-dots loading-xl"></span>
                  </div>
                  <p>Loading your podcasts...</p>
                </div>
              ) : podcasts.length > 0 ? (
                podcasts.map((podcast) => (
                  <Card key={podcast.id}>
                    <CardHeader>
                      <CardTitle>Podcast #{podcast.id}</CardTitle>
                      <ClientOnly>
                        <CardDescription>
                          Created on:{" "}
                          {new Date(podcast.created_at).toLocaleString()}
                        </CardDescription>
                      </ClientOnly>
                    </CardHeader>
                    <CardContent>
                      {podcast.status === "complete" ? (
                        <>
                          <p>
                            Status:{" "}
                            <span className="font-semibold capitalize text-green-600">
                              {podcast.status}
                            </span>
                          </p>
                          <div className="mt-4 flex flex-wrap items-center gap-2">
                            <Button
                              onClick={() => setCurrentlyPlaying(podcast)}
                            >
                              Listen Now
                            </Button>
                            <Button asChild variant="outline">
                              <a
                                href={podcast.final_podcast_url || "#"}
                                download={`Podcast_#${podcast.id}.mp3`}
                              >
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
                <p className="text-center text-gray-500">
                  You haven't created any podcasts yet.
                </p>
              )}
            </div>
          </section>
        </div>
      </main>

      {currentlyPlaying && (
        <AudioPlayer
          podcast={currentlyPlaying}
          onClose={() => setCurrentlyPlaying(null)}
        />
      )}

      <WelcomeDialog
        isOpen={showWelcomeDialog}
        onClose={handleWelcomeDialogClose}
      />
    </div>
  );
}
