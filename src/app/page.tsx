'use client'

import { useEffect, useState } from 'react'
import TripViewContent from './[country]/[city]/trip-view-content'
import TripEditContent from './[country]/[city]/edit/trip-edit-content'
import { useTrips } from '@/contexts/trips-context'
import { toSlug } from '@/lib/slug'

export default function Home() {
  const [parts, setParts] = useState<string[] | null>(null)
  const { trips, loaded } = useTrips()

  useEffect(() => {
    const segments = window.location.pathname.split('/').filter(Boolean)
    if (segments.length > 0) {
      setParts(segments)
    }
  }, [])

  useEffect(() => {
    if (parts !== null || !loaded) return
    const latest = trips
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
    if (latest) {
      window.location.replace(`/${toSlug(latest.country)}/${toSlug(latest.destination)}`)
    } else {
      window.location.replace('/plans/create')
    }
  }, [loaded, trips, parts])

  if (parts === null) return null

  // /[country]/[city]/edit
  if (parts.length >= 3 && parts[2] === 'edit') {
    return <TripEditContent country={parts[0]} city={parts[1]} />
  }

  // /[country]/[city]
  if (parts.length >= 2) {
    return <TripViewContent country={parts[0]} city={parts[1]} />
  }

  return null
}
