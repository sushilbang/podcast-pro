// frontend/app/dashboard/DashboardClient.tsx

"use client";

import type React from "react";
import { Pagination } from "@/components/ui/pagination";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import ClientOnly from "@/components/ui/client-only";
import Header from "@/components/layout/header-block";
import AudioPlayer from "@/components/ui/AudioPlayer";
import ConversionAnimation from "@/components/dashboard/ConversionAnimation";
import WelcomeDialog from "@/components/dashboard/WelcomeDialog";
import { Loader2, Download } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import Image from "next/image";

const API_URL = process.env.NEXT_PUBLIC_API_URL!;
const MAX_SIZE_MB = 10;

type Podcast = {
  id: number;
  status: "pending" | "processing" | "complete" | "failed";
  original_file_url: string | null;
  final_podcast_url: string | null;
  created_at: string;
};

export default function DashboardClient({
  initialPodcasts,
}: {
  initialPodcasts: Podcast[];
}) {

  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [podcasts, setPodcasts] = useState<Podcast[]>(initialPodcasts);
  const [uploadStatus, setUploadStatus] = useState("");
  const [currentlyPlaying, setCurrentlyPlaying] = useState<Podcast | null>(null);
  const [isFetchingPodcasts, setIsFetchingPodcasts] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [fileSizeMB, setFileSizeMB] = useState<number>(0);
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);
  const totalItems = podcasts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const currentPodcasts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return podcasts.slice(startIndex, startIndex + itemsPerPage);
  }, [podcasts, currentPage, itemsPerPage]);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        if (session?.user) {
          setUser(session.user);
        } else {
          router.replace("/login");
          return;
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        if (isMounted) router.replace("/login");
      } finally {
        if (isMounted) setIsAuthLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        if (event === "SIGNED_OUT" || !session?.user) {
          setUser(null);
          localStorage.removeItem("hasSeenWelcomeMessage");
          router.replace("/login");
        } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          setUser(session.user);
          setIsAuthLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  useEffect(() => {
    if (!user) return;
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcomeMessage");
    if (!hasSeenWelcome) setShowWelcomeDialog(true);
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const fetchPodcasts = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        const response = await fetch(`${API_URL}/podcasts/`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (response.ok) {
          const userPodcasts: Podcast[] = await response.json();
          setPodcasts(userPodcasts);
        } else {
          toast.error("Could not fetch your existing podcasts.");
        }
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to connect to the server.");
      } finally {
        setIsFetchingPodcasts(false);
      }
    };

    fetchPodcasts();
  }, [user, supabase]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      const processing = podcasts.filter(
        (p) => p.status === "pending" || p.status === "processing"
      );
      if (!processing.length) return;
      processing.forEach(async (podcast) => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) return;
          const res = await fetch(`${API_URL}/podcasts/${podcast.id}`, {
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
          if (res.ok) {
            const updated = await res.json();
            if (updated.status === "complete") {
              toast.success(`Podcast #${updated.id} is ready!`);
            } else if (updated.status === "failed") {
              toast.error(`Podcast #${updated.id} failed.`);
            }
          }
        } catch (err) {
          console.error("Polling error:", err);
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [podcasts, user, supabase]);

  const handleFileSelect = (file?: File) => {
    if (!file) return;
    if (file.type !== "application/pdf")
      return toast.error("Only PDF files are accepted.");
    const size = file.size / (1024 * 1024);
    if (size > MAX_SIZE_MB)
      return toast.error(`File must be smaller than ${MAX_SIZE_MB}MB.`);
    setSelectedFile(file);
    setFileSizeMB(size);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedFile || !user) return;

    setIsUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Session expired.");
        router.replace("/login");
        return;
      }

      setUploadStatus("Getting upload link...");
      const presignRes = await fetch(`${API_URL}/uploads/sign-url/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: selectedFile.name }),
      });

      if (!presignRes.ok) throw new Error("Failed to get upload URL");

      const { url, fields } = await presignRes.json();
      const formData = new FormData();
      Object.entries(fields).forEach(([k, v]) => formData.append(k, String(v)));
      formData.append("file", selectedFile);

      setUploadStatus("Uploading to S3...");
      const uploadRes = await fetch(url, { method: "POST", body: formData });
      if (!uploadRes.ok) throw new Error("Failed to upload file");

      setUploadStatus("Creating podcast job...");
      const createRes = await fetch(`${API_URL}/podcasts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ original_file_url: `${url}${fields.key}` }),
      });

      if (!createRes.ok) throw new Error("Failed to create podcast");

      const newPodcast = await createRes.json();
      setPodcasts((prev) => [newPodcast, ...prev]);
      toast.success("Podcast is being created!");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Something went wrong.");
    } finally {
      setIsUploading(false);
      setUploadStatus("");
      setSelectedFile(null);
      setFileSizeMB(0);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 bg-gray-50 dark:bg-gray-900">
      <Header />
      <main className="p-4 sm:p-8 md:p-12 max-w-5xl mx-auto">
        {/* Upload Section */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Create a New Podcast
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
            <div
              className={`relative border-2 border-dashed p-6 rounded-lg text-center ${
                dragOver ? "border-primary bg-primary/10" : "border-gray-300"
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
                <p className="mt-4 text-sm font-medium">
                  {selectedFile.name} ({fileSizeMB.toFixed(2)} MB)
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={!selectedFile || isUploading}>
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

        {/* Podcast List Section */}
        <section>
          <h2 className="text-3xl font-bold text-center mb-8">
            Your Podcasts
          </h2>
          {isFetchingPodcasts ? (
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading your podcasts...</p>
            </div>
          ) : podcasts.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {currentPodcasts.map((podcast) => (
                  <Card key={podcast.id} className="p-4 flex flex-col">
                    <div className="relative h-40 mb-4">
                      <Image
                        src="/images/pod_thumb.png"
                        alt={`Podcast #${podcast.id}`}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <CardHeader className="p-0">
                      <CardTitle>Podcast #{podcast.id}</CardTitle>
                      <ClientOnly>
                        <CardDescription>
                          {new Date(podcast.created_at).toLocaleString()}
                        </CardDescription>
                      </ClientOnly>
                    </CardHeader>
                    <CardContent className="mt-2 space-y-2">
                      {podcast.status === "complete" ? (
                        <>
                          <p>
                            Status:{" "}
                            <span className="text-green-600 font-semibold">
                              {podcast.status}
                            </span>
                          </p>
                          <div className="flex gap-2 flex-wrap">
                            <Button size="sm" onClick={() => setCurrentlyPlaying(podcast)}>
                              Listen
                            </Button>
                            <Button size="sm" asChild variant="outline">
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
                ))}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
              />
            </>
          ) : (
            <p className="text-center text-gray-500">
              You haven&apos;t created any podcasts yet.
            </p>
          )}
        </section>
      </main>

      {currentlyPlaying && (
        <AudioPlayer
          podcast={currentlyPlaying}
          onClose={() => setCurrentlyPlaying(null)}
        />
      )}

      <WelcomeDialog
        isOpen={showWelcomeDialog}
        onClose={() => {
          localStorage.setItem("hasSeenWelcomeMessage", "true");
          setShowWelcomeDialog(false);
        }}
      />
    </div>
  );
}
