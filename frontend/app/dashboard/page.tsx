"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { supabase } from '@/lib/supabase';
import ClientOnly from "@/components/ui/client-only";
import Header from "@/components/Layout/Header";

import { useRouter } from 'next/navigation';

// Define the backend API URL
const API_URL = "http://127.0.0.1:8000";

type Podcast = {
  id: number;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  original_file_url: string | null;
  final_podcast_url: string | null;
  created_at: string;
};

export default function Home() {
  const router = useRouter();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [uploadStatus, setUploadStatus] = useState("");
  useEffect(() => {
    const interval = setInterval(() => {
      // Find all podcasts that are still processing
      const processingPodcasts = podcasts.filter(p => p.status === 'pending' || p.status === 'processing');
      
      // For each one, fetch its latest status from the backend
      processingPodcasts.forEach(async (podcast) => {
        try {
          const response = await fetch(`${API_URL}/podcasts/${podcast.id}`);
          if (response.ok) {
            const updatedPodcast: Podcast = await response.json();
            // Update the podcast in our local state if the status has changed
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
    }, 5000); // Poll every 5 seconds

    // Cleanup function to stop polling when the component unmounts
    return () => clearInterval(interval);
  }, [podcasts]); // Rerun this effect if the podcasts list changes

  useEffect(() => {
    const fetchPodcasts = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const token = session.access_token;
        try {
          const response = await fetch(`${API_URL}/podcasts/`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
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
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // If no user is logged in, redirect to the login page
        router.push('/login');
      }
    };
    checkUser();
  }, [router]);

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
    return;
    }
    const token = session.access_token;

    try {
      // --- Step 1: Get a pre-signed URL from our backend ---
      setUploadStatus("Getting upload link...");
      const presignedUrlResponse = await fetch(`${API_URL}/uploads/sign-url/`, {
          method: 'POST', // Explicitly use the POST method
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify({ filename: selectedFile.name }), // Send filename in the body
      });
      if (!presignedUrlResponse.ok) throw new Error("Failed to get pre-signed URL.");
      
      const { url, fields } = await presignedUrlResponse.json();
      const fileUrlInS3 = `${url}${fields.key}`; // The final URL of the file in S3

      // --- Step 2: Upload the file directly to S3 using the pre-signed URL ---
      setUploadStatus("Uploading file to S3...");
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value as string);
      });
      // The actual file content MUST be the last field
      formData.append("file", selectedFile);

      const uploadResponse = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("S3 upload error response:", errorText);
        throw new Error("S3 upload failed.");
      }

      // --- Step 3: Tell our backend to create the podcast job ---
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
      setSelectedFile(null); // Clear the file input

    } catch (error) {
      console.error("Upload process failed:", error);
      alert("An error occurred. Please check the console.");
    } finally {
      setIsUploading(false);
      setUploadStatus("");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header/>
        <main className="flex flex-col items-center p-4 sm:p-8 md:p-12">
        <div className="z-10 w-full max-w-5xl">

            <section className="mb-16">
                <h2 className="text-3xl font-bold text-center mb-8">Create a New Podcast</h2>
                    <form onSubmit={handleSubmit} className="flex w-full max-w-lg mx-auto items-center space-x-2 mb-16">
                    <Input
                        type="file"
                        onChange={handleFileChange}
                        required
                        className="flex-grow"
                    />
                    <Button type="submit" disabled={isUploading}>
                        {isUploading ? uploadStatus : "Create Podcast"}
                    </Button>
                    </form> 
            </section>

            <div className="w-full">
            <h2 className="text-2xl font-semibold mb-4 text-center">Your Podcasts</h2>
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
                        <p>Status: <span className="font-semibold">{podcast.status}</span></p>
                        {podcast.status === 'complete' ? (
                        <Button asChild className="mt-4">
                            <a href={podcast.final_podcast_url || "#"} target="_blank" rel="noopener noreferrer">
                            Listen Now
                            </a>
                        </Button>
                        ) : (
                        <p className="text-sm text-gray-500 mt-2">Processing... please wait.</p>
                        )}
                    </CardContent>
                    </Card>
                ))
                ) : (
                <p className="text-center text-gray-500">You haven't created any podcasts yet.</p>
                )}
            </div>
            </div>
        </div>
        </main>
    </div>
  );
}