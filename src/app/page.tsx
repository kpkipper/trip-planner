'use client'

import { useEffect, useState } from 'react'
import TripViewContent from './[country]/[city]/trip-view-content'
import TripEditContent from './[country]/[city]/edit/trip-edit-content'

export default function Home() {
  const [parts, setParts] = useState<string[] | null>(null)

  useEffect(() => {
    const segments = window.location.pathname.split('/').filter(Boolean)
    if (segments.length === 0) {
      window.location.replace('/japan/tokyo')
    } else {
      setParts(segments)
    }
  }, [])

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
