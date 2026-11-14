'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import PageLoading from '@/components/page-loading'
import { useAuth } from '@/contexts/auth-context'

// The home page has no content of its own: logged-in users go to their feed,
// everyone else to /trips, which lists every public trip.
export default function Home() {
  const router = useRouter()
  const { status } = useAuth()

  useEffect(() => {
    if (status === 'loading') return
    router.replace(status === 'authed' ? '/feed' : '/trips')
  }, [status, router])

  return <PageLoading />
}
