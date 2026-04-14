'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Trip } from '@/types/trip'

const STORAGE_KEY = 'trip-planner-trips'

// Built-in trips — data preserved in tokyo-trip.constant.ts, view handled by TokyoTrip component
const BUILTIN_TRIPS: Trip[] = [
  {
    id: 'builtin-tokyo-2025',
    title: 'Tokyo 2025',
    destination: 'Tokyo',
    country: 'Japan',
    startDate: '2025-05-04',
    endDate: '2025-05-11',
    days: [],
    createdAt: '2025-05-04T00:00:00.000Z',
    updatedAt: '2025-05-04T00:00:00.000Z',
  },
]

interface TripsContextValue {
  trips: Trip[]
  loaded: boolean
  addTrip: (trip: Trip) => void
  updateTrip: (trip: Trip) => void
  deleteTrip: (id: string) => void
  getTrip: (id: string) => Trip | undefined
}

const TripsContext = createContext<TripsContextValue | null>(null)

export function TripsProvider({ children }: { children: React.ReactNode }) {
  const [staticTrips, setStaticTrips] = useState<Trip[]>([])
  const [userTrips, setUserTrips] = useState<Trip[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    // Load localStorage trips synchronously
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setUserTrips(JSON.parse(stored))
    } catch {
      // ignore
    }

    // Load static trips from public/data/trips.json
    fetch('/data/trips.json')
      .then((r) => r.json())
      .then((data: Trip[]) => setStaticTrips(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const persist = (newTrips: Trip[]) => {
    setUserTrips(newTrips)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTrips))
    } catch {
      // ignore
    }
  }

  const allBuiltinIds = new Set([...BUILTIN_TRIPS.map((t) => t.id), ...staticTrips.map((t) => t.id)])

  // Static trips override localStorage trips with the same ID
  const allTrips = [
    ...BUILTIN_TRIPS,
    ...staticTrips,
    ...userTrips.filter((t) => !allBuiltinIds.has(t.id)),
  ]

  return (
    <TripsContext.Provider
      value={{
        trips: allTrips,
        loaded,
        addTrip: (trip) => persist([...userTrips, trip]),
        updateTrip: (trip) => persist(userTrips.map((t) => (t.id === trip.id ? trip : t))),
        deleteTrip: (id) => persist(userTrips.filter((t) => t.id !== id)),
        getTrip: (id) => allTrips.find((t) => t.id === id),
      }}
    >
      {children}
    </TripsContext.Provider>
  )
}

export function useTrips() {
  const ctx = useContext(TripsContext)
  if (!ctx) throw new Error('useTrips must be used within TripsProvider')
  return ctx
}
