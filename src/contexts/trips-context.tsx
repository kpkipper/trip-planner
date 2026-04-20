'use client'

import { createContext, useContext, useEffect, useState } from 'react'

import { usePathname } from 'next/navigation'

import { getJourneys } from '@/api/journey'
import { toTripList } from '@/utils/format-data'

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

  useEffect(() => {
    setLoaded(false)
    getJourneys()
      .then(({ data }) => setUserTrips(toTripList(data ?? [])))
      .catch((err) => console.error('Failed to load trips', err))
      .finally(() => setLoaded(true))
  }, [pathname])

  return (
    <TripsContext.Provider value={{ trips: userTrips, loaded }}>{children}</TripsContext.Provider>
  )
}

export function useTrips() {
  const ctx = useContext(TripsContext)
  if (!ctx) throw new Error('useTrips must be used within TripsProvider')
  return ctx
}
