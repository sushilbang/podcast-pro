import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'

/**
 * Hook to redirect authenticated users away from public pages (login, signup, demo, etc.)
 * If user is logged in, redirects to dashboard
 */
export function useAuthRedirect() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        router.push('/dashboard')
      }
    }

    checkAuth()
  }, [router])
}
