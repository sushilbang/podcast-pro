"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react'
import Link from "next/link"

export function OopsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900 font-orbitron">
            Oops! Service Temporarily Unavailable
          </CardTitle>
          <CardDescription className="text-gray-600 mt-2 font-geist-mono">
            We're currently performing maintenance on our podcast generation service. 
            Please check back in a few minutes.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-700 mb-2 font-orbitron">
              <strong>What's happening?</strong>
            </p>
            <p className="text-xs text-gray-600 font-geist-mono">
              Our AI-powered podcast generation is temporarily disabled while we make improvements to serve you better.
            </p>
          </div>

          <div>
            <Button variant="outline" asChild className="w-full gap-2 font-orbitron">
              <Link href="/">
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-400 font-geist-mono">
              Status: Generation service offline
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
