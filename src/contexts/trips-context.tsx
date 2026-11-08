'use client'

import { createContext, useContext, useEffect, useState } from 'react'

import { usePathname } from 'next/navigation'

import { getJourneys } from '@/api/journey'
import { toTripList } from '@/utils/format-data'

import { useAuth } from './auth-context'

import type { Trip } from '@/types/trip'

interface TripsContextValue {
  trips: Trip[]
  loaded: boolean
}

const TripsContext = createContext<TripsContextValue | null>(null)

export function TripsProvider({ children }: { children: React.ReactNode }) {
  const [userTrips, setUserTrips] = useState<Trip[]>([])
  const [loaded, setLoaded] = useState(false)
  const pathname = usePathname()
  const { status } = useAuth()
  // Refetch when the page or the login state changes (login/logout changes what is visible).
  const loadKey = `${status}:${pathname}`
  const [loadedKey, setLoadedKey] = useState(loadKey)

  // Mark as loading again as soon as the key changes, before the refetch below.
  if (loadedKey !== loadKey) {
    setLoadedKey(loadKey)
    setLoaded(false)
  }

  useEffect(() => {
    // Wait until we know whether the user is logged in, so the list is fetched once.
    if (status === 'loading') return
    let cancelled = false
    getJourneys()
      .then(({ data }) => {
        if (!cancelled) setUserTrips(toTripList(data ?? []))
      })
      .catch((err) => console.error('Failed to load trips', err))
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [pathname, status])

  return (
    <TripsContext.Provider value={{ trips: userTrips, loaded }}>{children}</TripsContext.Provider>
  )
}

export function useTrips() {
  const ctx = useContext(TripsContext)
  if (!ctx) throw new Error('useTrips must be used within TripsProvider')
  return ctx
}
