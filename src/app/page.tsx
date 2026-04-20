'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import PageLoading from '@/components/page-loading'
import { useTrips } from '@/contexts/trips-context'

export default function Home() {
  const router = useRouter()
  const { trips, loaded } = useTrips()

  useEffect(() => {
    if (!loaded) return
    const latest = trips
      .slice()
      .sort(
        (a, b) =>
          (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) -
          (a.updatedAt ? new Date(a.updatedAt).getTime() : 0),
      )[0]
    router.replace(latest ? `/plans/${latest.slug}` : '/plans/create')
  }, [loaded, trips, router])

  return <PageLoading />
}
