"use client"

import type React from "react"
import { useState } from "react"
import { X } from "lucide-react"

interface UploadAreaProps {
  selectedFile: File | null
  onFileSelect: (file: File | null) => void
  onUpload: () => void
  isUploading: boolean
}

export function UploadArea({ selectedFile, onFileSelect, isUploading }: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      onFileSelect(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onFileSelect(files[0])
    }
  }

  return (
    <div
      className={`relative border border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragOver ? "border-black bg-gray-50" : "border-gray-200 hover:border-gray-300"
      }`}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
      />

      {selectedFile ? (
        <div className="flex items-center justify-center gap-3">
          <div className="text-left">
            <p className="font-medium">{selectedFile.name}</p>
            <p className="text-sm text-gray-500">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Reset file selection
              const input = e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement
              if (input) input.value = ""
              onFileSelect(null)
            }}
            disabled={isUploading}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div>
          <p className="font-medium mb-1">Drop your PDF here</p>
          <p className="text-sm text-gray-500">or click to browse files</p>
          <p className="text-xs text-gray-400 mt-2">Maximum file size: 10MB</p>
        </div>
      )}
    </div>
  )
}
