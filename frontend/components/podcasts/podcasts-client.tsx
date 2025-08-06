"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Input } from "@/components/ui/input"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { Clock, CheckCircle, AlertCircle, FileText } from 'lucide-react'

type Podcast = {
  id: number
  title: string | null  // Make title nullable
  status: "pending" | "processing" | "complete" | "failed"
  original_file_url: string | null
  final_podcast_url: string | null
  created_at: string
  duration: number
  file_size: string
  description: string
  tags: string[]
  plays: number
}

interface PodcastsClientProps {
  initialPodcasts: Podcast[]
}

// Skeleton component for loading podcasts
function PodcastSkeleton() {
  return (
    <div className="block relative animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-4 py-4">
        {/* Title skeleton */}
        <div className="sm:col-span-6 min-w-0">
          <div className="h-5 bg-gray-200 rounded mb-2 w-3/4"></div>
          <div className="sm:hidden flex items-center gap-4 mt-1">
            <div className="h-3 bg-gray-200 rounded w-12"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
            <div className="h-3 bg-gray-200 rounded w-20"></div>
          </div>
        </div>

        {/* Duration skeleton - Desktop only */}
        <div className="hidden sm:flex sm:col-span-2 items-center">
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>

        {/* Created Date skeleton - Desktop only */}
        <div className="hidden sm:flex sm:col-span-2 items-center">
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>

        {/* Status skeleton - Desktop only */}
        <div className="hidden sm:flex sm:col-span-2 items-center">
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      </div>
    </div>
  )
}

export function PodcastsClient({ initialPodcasts }: PodcastsClientProps) {
  const [podcasts] = useState<Podcast[]>(initialPodcasts)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortBy, setSortBy] = useState<"date" | "title" | "duration">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [loadingPodcastId, setLoadingPodcastId] = useState<number | null>(null)
  const [isNavigatingToCreate, setIsNavigatingToCreate] = useState(false)

  const router = useRouter()

  const handlePodcastClick = (podcast: Podcast) => {
    if (podcast.status !== "complete") return

    setLoadingPodcastId(podcast.id)
    router.push(`/dashboard/podcasts/${podcast.id}`)
    // Reset loading state after navigation
    setTimeout(() => setLoadingPodcastId(null), 1000)
  }

  const handleCreateNew = () => {
    setIsNavigatingToCreate(true)
    router.push("/dashboard")
  }

  const itemsPerPage = 20

  const filteredAndSortedPodcasts = useMemo(() => {
    const filtered = podcasts.filter((podcast) => {
      // Safe search handling - handle null/undefined titles
      const title = podcast.title || ""
      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || podcast.status === statusFilter
      return matchesSearch && matchesStatus
    })

    filtered.sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case "date":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case "title":
          // Safe title comparison
          const titleA = a.title || `Podcast #${a.id}`
          const titleB = b.title || `Podcast #${b.id}`
          comparison = titleA.localeCompare(titleB)
          break
        case "duration":
          comparison = a.duration - b.duration
          break
      }

      return sortOrder === "desc" ? -comparison : comparison
    })

    return filtered
  }, [podcasts, searchQuery, statusFilter, sortBy, sortOrder])

  const totalPages = Math.ceil(filteredAndSortedPodcasts.length / itemsPerPage)
  const currentPodcasts = filteredAndSortedPodcasts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const getStatusIcon = (status: Podcast["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "processing":
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />
    }
  }

  const getStatusText = (status: Podcast["status"]) => {
    switch (status) {
      case "complete":
        return "Ready"
      case "processing":
        return "Processing"
      case "pending":
        return "Pending"
      case "failed":
        return "Failed"
    }
  }

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return "—"
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder("desc")
    }
  }

  // Helper function to get display title
  const getDisplayTitle = (podcast: Podcast) => {
    return podcast.title || `Podcast #${podcast.id}`
  }

  // Helper function to check if podcast is being processed
  const isProcessing = (status: Podcast["status"]) => {
    return status === "processing" || status === "pending"
  }

  return (
    <div className="min-h-screen bg-white">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-light mb-2">Audio Library</h1>
            <p className="text-gray-600">{filteredAndSortedPodcasts.length} items</p>
          </div>

          <Button onClick={handleCreateNew} disabled={isNavigatingToCreate}>
            {isNavigatingToCreate ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Loading...
              </>
            ) : (
              "Create New"
            )}
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <Input
            placeholder="Search by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-transparent">
                  Status: {statusFilter === "all" ? "All" : statusFilter}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setStatusFilter("all")}>All</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("complete")}>Ready</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("processing")}>Processing</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter("failed")}>Failed</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-transparent">
                  Sort: {sortBy} {sortOrder === "desc" ? "↓" : "↑"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleSort("date")}>Date</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("title")}>Title</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort("duration")}>Duration</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* List */}
        {currentPodcasts.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No audio content found</p>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            {/* List Header */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-4 py-3 text-sm font-medium text-gray-500 border-b border-gray-100">
              <div className="col-span-6">Title</div>
              <div className="col-span-2">Duration</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-2">Status</div>
            </div>

            {/* List Items */}
            <div className="divide-y divide-gray-50">
              {currentPodcasts.map((podcast) => {
                // Show skeleton for processing podcasts without titles
                if (isProcessing(podcast.status) && !podcast.title) {
                  return <PodcastSkeleton key={`skeleton-${podcast.id}`} />
                }

                return (
                  <div
                    key={podcast.id}
                    onClick={() => handlePodcastClick(podcast)}
                    className={`block relative ${
                      podcast.status === "complete" ? "cursor-pointer hover:bg-gray-50" : "cursor-default"
                    } ${loadingPodcastId === podcast.id ? "opacity-75" : ""}`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 px-4 py-4">
                      {/* Loading overlay for specific item */}
                      {loadingPodcastId === podcast.id && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                          <LoadingSpinner size="sm" />
                        </div>
                      )}

                      {/* Title */}
                      <div className="sm:col-span-6 min-w-0">
                        <div className="flex items-center gap-2">
                          {isProcessing(podcast.status) && (
                            <div className="flex items-center gap-1">
                              {getStatusIcon(podcast.status)}
                              <LoadingSpinner size="sm" />
                            </div>
                          )}
                          <h3
                            className={`font-medium truncate ${
                              podcast.status === "complete" ? "text-gray-900 hover:text-black" : "text-gray-500"
                            } ${isProcessing(podcast.status) && !podcast.title ? "italic" : ""}`}
                          >
                            {getDisplayTitle(podcast)}
                            {isProcessing(podcast.status) && !podcast.title && (
                              <span className="text-gray-400 ml-2">(Creating...)</span>
                            )}
                          </h3>
                        </div>
                        <div className="sm:hidden flex items-center gap-4 mt-1 text-sm text-gray-500">
                          <span>{formatDuration(podcast.duration)}</span>
                          <span>{formatDate(podcast.created_at)}</span>
                          <span>{getStatusText(podcast.status)}</span>
                        </div>
                      </div>

                      {/* Duration - Desktop only */}
                      <div className="hidden sm:flex sm:col-span-2 items-center">
                        <span className="text-sm text-gray-600">{formatDuration(podcast.duration)}</span>
                      </div>

                      {/* Created Date - Desktop only */}
                      <div className="hidden sm:flex sm:col-span-2 items-center">
                        <span className="text-sm text-gray-600">{formatDate(podcast.created_at)}</span>
                      </div>

                      {/* Status - Desktop only */}
                      <div className="hidden sm:flex sm:col-span-2 items-center">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(podcast.status)}
                          <span
                            className={`text-sm ${
                              podcast.status === "complete"
                                ? "text-green-600"
                                : podcast.status === "processing" || podcast.status === "pending"
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {getStatusText(podcast.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i
                  if (pageNum > totalPages) return null

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-10 h-8"
                    >
                      {pageNum}
                    </Button>
                  )
                })}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
