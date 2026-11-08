'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import PageLoading from '@/components/page-loading'
import { useAuth } from '@/contexts/auth-context'
import { useTrips } from '@/contexts/trips-context'
import { loginPath } from '@/lib/safe-next'

export default function Home() {
  const router = useRouter()
  const { trips, loaded } = useTrips()
  const { status } = useAuth()

  useEffect(() => {
    if (!loaded || status === 'loading') return
    const latest = trips
      .slice()
      .sort(
        (a, b) =>
          (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) -
          (a.updatedAt ? new Date(a.updatedAt).getTime() : 0),
      )[0]
    // Nothing to show: creating a plan needs a login, so anonymous visitors go there first.
    const empty = status === 'authed' ? '/plans/create' : loginPath('/plans/create')
    router.replace(latest ? `/plans/${encodeURIComponent(latest.slug ?? '')}` : empty)
  }, [loaded, status, trips, router])

  return <PageLoading />
}
