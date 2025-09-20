"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { UploadArea } from "@/components/dashboard/upload-area"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const API_URL = process.env.NEXT_PUBLIC_API_URL!

export function DashboardClient() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isNavigatingToLibrary, setIsNavigatingToLibrary] = useState(false)
  const [requirements, setRequirements] = useState("")
  const [speechModel, setSpeechModel] = useState("")
  const [outputType, setOutputType] = useState("")

  const supabase = createClient()
  const router = useRouter()

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
    if (!selectedFile || !speechModel || !outputType) {
      toast.error("Please fill in all required fields")
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
        headers: { "Content-Type": "application/json" },
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
          speech_model: speechModel,
          output_type: outputType,
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
      setSpeechModel("")
      setOutputType("")

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

          {/* Model Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Speech Model <span className="text-red-500">*</span>
              </Label>
              <Select value={speechModel} onValueChange={setSpeechModel} disabled={isUploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose voice model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lemonfox">LemonFox</SelectItem>
                  <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-medium">
                Output Type <span className="text-red-500">*</span>
              </Label>
              <Select value={outputType} onValueChange={setOutputType} disabled={isUploading}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose output type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">Summary</SelectItem>
                  <SelectItem value="podcast">Podcast</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !speechModel || !outputType || isUploading}
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
