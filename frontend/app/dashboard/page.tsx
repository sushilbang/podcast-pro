"use client";

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import ClientOnly from "@/components/ui/client-only"; // FIXED PATH
import Header from "@/components/layout/Header"; // FIXED PATH
import AudioPlayer from "@/components/ui/AudioPlayer";
import ConversionAnimation from "@/components/dashboard/ConversionAnimation";

// Define the backend API UR
const API_URL = "http://127.0.0.1:8000";

type Podcast = {
  id: number;
  status: 'pending' | 'processing' | 'complete' | 'failed';
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
  const [currentlyPlaying, setCurrentlyPlaying] = useState<Podcast | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      }
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    const fetchPodcasts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const token = session.access_token;
        try {
          const response = await fetch(`${API_URL}/podcasts/`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const userPodcasts: Podcast[] = await response.json();
            setPodcasts(userPodcasts);
          }
        } catch (error) {
          console.error("Failed to fetch podcasts:", error);
        }
      }
    };
    fetchPodcasts();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const processingPodcasts = podcasts.filter(p => p.status === 'pending' || p.status === 'processing');
      processingPodcasts.forEach(async (podcast) => {
        const { data: { session } } = await supabase.auth.getSession();
        if(!session) return;
        try {
          const response = await fetch(`${API_URL}/podcasts/${podcast.id}`,{
              headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          if (response.ok) {
            const updatedPodcast: Podcast = await response.json();
            if (updatedPodcast.status !== podcast.status) {
              setPodcasts(prevPodcasts => 
                prevPodcasts.map(p => p.id === updatedPodcast.id ? updatedPodcast : p)
              );
            }
          }
        } catch (error) {
          console.error("Error polling for podcast status:", error);
        }
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [podcasts]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      alert("Please select a file first.");
      return;
    }
    setIsUploading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("You must be logged in to create a podcast.");
      setIsUploading(false);
      return;
    }
    const token = session.access_token;
    try {
      setUploadStatus("Getting upload link...");
      const presignedUrlResponse = await fetch(`${API_URL}/uploads/sign-url/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: selectedFile.name }),
      });
      if (!presignedUrlResponse.ok) throw new Error("Failed to get pre-signed URL.");
      const { url, fields } = await presignedUrlResponse.json();
      const fileUrlInS3 = `${url}${fields.key}`;
      setUploadStatus("Uploading file to S3...");
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      formData.append("file", selectedFile);
      const uploadResponse = await fetch(url, { method: 'POST', body: formData });
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("S3 upload error response:", errorText);
        throw new Error("S3 upload failed.");
      }
      setUploadStatus("Creating podcast job...");
      const createPodcastResponse = await fetch(`${API_URL}/podcasts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ original_file_url: fileUrlInS3 }),
      });
      if (!createPodcastResponse.ok) throw new Error('Failed to create podcast job.');
      const newPodcast: Podcast = await createPodcastResponse.json();
      setPodcasts(prevPodcasts => [newPodcast, ...prevPodcasts]);
      setSelectedFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Upload process failed:", error);
      alert("An error occurred. Please check the console.");
    } finally {
      setIsUploading(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-28">
      <Header />
      <main className="flex flex-col items-center p-4 sm:p-8 md:p-12">
        <div className="z-10 w-full max-w-5xl">
          <section className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-8">Create a New Podcast</h2>
            <form onSubmit={handleSubmit} className="flex w-full max-w-lg mx-auto items-center space-x-2">
              <Input type="file" onChange={handleFileChange} required className="flex-grow" />
              <Button type="submit" disabled={!selectedFile || isUploading}>
                {isUploading ? uploadStatus : "Create Podcast"}
              </Button>
            </form>
          </section>
          <section>
            <h2 className="text-3xl font-bold text-center mb-8">Your Podcasts</h2>
            <div className="space-y-4">
              {podcasts.length > 0 ? (
                podcasts.map((podcast) => (
                  <Card key={podcast.id}>
                    <CardHeader>
                      <CardTitle>Podcast #{podcast.id}</CardTitle>
                      <ClientOnly>
                        <CardDescription>
                          Created on: {new Date(podcast.created_at).toLocaleString()}
                        </CardDescription>
                      </ClientOnly>
                    </CardHeader>
                    <CardContent>
                      {podcast.status === 'complete' ? (
                        <>
                          <p>Status: <span className="font-semibold capitalize text-green-600">{podcast.status}</span></p>
                          <Button
                            onClick={() => setCurrentlyPlaying(podcast)}
                            className="mt-4"
                          >
                            Listen Now
                          </Button>
                        </>
                      ) : (
                        /* If it's pending, processing, or failed, show our animation component */
                        <ConversionAnimation status={podcast.status} />
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-gray-500">You haven't created any podcasts yet.</p>
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
    </div>
  );
}