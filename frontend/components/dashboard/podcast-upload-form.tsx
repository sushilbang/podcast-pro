"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { UploadArea } from "@/components/dashboard/upload-area"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL!

interface CreditsInfo {
  character_count: number
  character_limit: number
  characters_available: number
  usage_percentage: number
  status: string
}

export function PodcastUploadForm() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isNavigatingToLibrary, setIsNavigatingToLibrary] = useState(false)
  const [requirements, setRequirements] = useState("")
  const [credits, setCredits] = useState<CreditsInfo | null>(null)
  const [isLoadingCredits, setIsLoadingCredits] = useState(true)

  const supabase = createClient()
  const router = useRouter()
  const generationEnabled = process.env.GENERATION_ENABLED !== 'false';
  // Fetch global ElevenLabs credits on component mount
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        setIsLoadingCredits(true)
        const res = await fetch(`${API_URL}/elevenlabs/credits`)

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ detail: "Failed to fetch credits" }))
          throw new Error(errorData.detail || `HTTP ${res.status}`)
        }
        const creditsData = await res.json()
        setCredits(creditsData)
      } catch (error) {
        console.error("Error fetching credits:", error)
        const errorMessage = error instanceof Error ? error.message : "Failed to fetch ElevenLabs credits"
        toast.error(`Credits: ${errorMessage}`)
      } finally {
        setIsLoadingCredits(false)
      }
    }

    fetchCredits()
  }, [])

  const handleFileSelect = (file: File | null) => {
    // If a file is passed, validate it
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are accepted");
        // Clear the selection if the file is invalid
        setSelectedFile(null);
        return;
      }
      if (file.size > 1 * 1024 * 1024) {
        toast.error("File must be smaller than 1MB");
        setSelectedFile(null);
        return;
      }
      // If valid, set the state
      setSelectedFile(file);
    } else {
      // If null is passed (from the "X" button), clear the state
      setSelectedFile(null);
    }
  };

  const handleNavigateToLibrary = async () => {
    setIsNavigatingToLibrary(true)
    try {
      router.push("/dashboard/podcasts")
    } catch (error) {
      console.error("Navigation error:", error)
      toast.error("Failed to navigate to library")
    } finally {
      setIsNavigatingToLibrary(false)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please add a file")
      return
    }

    setIsUploading(true)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error("Session expired")
        router.replace("/login")
        return
      }

      // Get presigned URL
      const presignRes = await fetch(`${API_URL}/uploads/sign-url/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ filename: selectedFile.name }),
      })

      if (!presignRes.ok) {
        const errorData = await presignRes.text()
        throw new Error(`Failed to get upload URL: ${errorData}`)
      }

      const { url, fields } = await presignRes.json()
      const formData = new FormData()
      Object.entries(fields).forEach(([k, v]) => formData.append(k, String(v)))
      formData.append("file", selectedFile)

      // Upload to S3
      const uploadRes = await fetch(url, { method: "POST", body: formData })
      if (!uploadRes.ok) {
        throw new Error(`Failed to upload file: ${uploadRes.statusText}`)
      }

      // Create podcast with new fields
      const createRes = await fetch(`${API_URL}/podcasts/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          original_file_url: `${url}${fields.key}`,
          requirements: requirements || null,
        }),
      })

      if (!createRes.ok) {
        const errorData = await createRes.text()
        throw new Error(`Failed to create podcast: ${errorData}`)
      }

      const podcastResponse = await createRes.json()
      
      toast.success("Audio content is being created!")

      // Reset form
      setSelectedFile(null)
      setRequirements("")

      // Redirect to creation status page (as discussed in previous conversation)
      router.push(`/dashboard/podcast-creation/${podcastResponse.id}`)
      
    } catch (err) {
      console.error("Upload error:", err)
      toast.error(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />

      <main className="max-w-2xl mx-auto px-4 py-16">
        {/* ElevenLabs Credits Section */}
        <div className="mb-8 p-4 border border-gray-200 rounded-lg bg-gray-50">
          {isLoadingCredits ? (
            <div className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              <p className="text-sm text-gray-600">Loading credits...</p>
            </div>
          ) : credits ? (
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-900">ElevenLabs Credits Available Globally</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {credits.characters_available.toLocaleString()} characters available
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {credits.usage_percentage.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-600">
                    {credits.character_count.toLocaleString()} / {credits.character_limit.toLocaleString()}
                  </p>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    credits.usage_percentage > 80
                      ? "bg-red-500"
                      : credits.usage_percentage > 50
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${credits.usage_percentage}%` }}
                />
              </div>
              {credits.characters_available < 5000 && (
                <p className="text-xs text-red-600 mt-2">
                  ⚠️ Low credits: You may not have enough characters for a podcast generation
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Unable to load credits information</p>
          )}
        </div>

        {/* Creation Form */}
        <div className="space-y-8">
          {/* File Upload */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Document</Label>
            <UploadArea
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              onUpload={() => {}}
              isUploading={isUploading}
            />
          </div>

          {/* Requirements */}
          <div className="space-y-3">
            <Label htmlFor="requirements" className="text-sm font-medium">
              Requirements <span className="text-gray-400">(optional)</span>
            </Label>
            <Textarea
              id="requirements"
              placeholder="Describe how you want your content processed. For example: 'Focus on the key findings and make it conversational' or 'Create a technical deep-dive for experts' or 'Summarize the main points in simple terms'"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              className="min-h-24 resize-none text-sm"
              disabled={isUploading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={handleUpload}
              disabled={!generationEnabled || !selectedFile || isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating...
                </>
              ) : (
                "Create Audio Content"
              )}
            </Button>

            <Button
              variant="outline"
              onClick={handleNavigateToLibrary}
              disabled={isUploading || isNavigatingToLibrary}
              className="bg-transparent"
            >
              {isNavigatingToLibrary ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Loading...
                </>
              ) : (
                "View Library"
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
