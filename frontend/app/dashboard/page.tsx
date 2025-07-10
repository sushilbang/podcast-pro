import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import DashboardClient from "./DashboardClient"
import {toast} from 'sonner'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    // console.log("Dashboard - no user, redirecting to login")
    return redirect("/login")
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  let podcasts = []
  if (token) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/podcasts/`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      })
      if (res.ok) {
        podcasts = await res.json()
      }
    } catch (error) {
      // console.log(error);
      if (error instanceof Error) {
        toast.error(`Failed to fetch podcasts: ${error.message}`)
      } else {
        toast.error("An unknown error occurred while fetching podcasts.")
      }
    }
  }

  return <DashboardClient initialPodcasts={podcasts} />
}
