'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Trip } from '@/types/trip'
import {
  createJourney,
  deleteJourney,
  getJourneys,
  getJourneyById,
  updateJourney,
} from '@/api/journey'
import { formatListJourney, formatJourneyDetail } from '@/api/journey/utils'

interface TripsContextValue {
  trips: Trip[]
  loaded: boolean
  addTrip: (trip: Trip) => Promise<string>
  updateTrip: (trip: Trip) => Promise<void>
  deleteTrip: (id: string) => Promise<string>
  getTrip: (id: string) => Trip | undefined
  loadTrip: (id: string) => Promise<Trip>
}

const TripsContext = createContext<TripsContextValue | null>(null)

export function TripsProvider({ children }: { children: React.ReactNode }) {
  const [userTrips, setUserTrips] = useState<Trip[]>([])
  const [loaded, setLoaded] = useState(false)

  const fetchTrips = async (): Promise<Trip[]> => {
    const res = await getJourneys()
    return formatListJourney(res.data ?? [])
  }

  const fetchTripById = async (id: string): Promise<Trip> => {
    const res = await getJourneyById(id)
    return formatJourneyDetail(res.data)
  }

  const addTripRequest = async (trip: Trip): Promise<string> => {
    const res = await createJourney(trip)
    return res.code
  }

  const updateTripRequest = async (trip: Trip): Promise<Trip> => {
    const res = await updateJourney(trip.id, trip)
    return formatJourneyDetail(res.data)
  }

  const deleteTripRequest = async (id: string): Promise<string> => {
    const res = await deleteJourney(id)
    return res.code
  }

  const mergeTrips = (prev: Trip[], incoming: Trip[]): Trip[] => {
    const merged = [...prev]
    for (const trip of incoming) {
      const idx = merged.findIndex((t) => t.id === trip.id)
      if (idx >= 0) merged[idx] = trip
      else merged.push(trip)
    }
    return merged
  }

  const loadTrips = async () => {
    try {
      const trips = await fetchTrips()
      setUserTrips((prev) => mergeTrips(prev, trips))
    } catch (err) {
      console.error('Failed to load trips', err)
    } finally {
      setLoaded(true)
    }
  }

  useEffect(() => {
    loadTrips()
  }, [])

  return (
    <TripsContext.Provider
      value={{
        trips: userTrips,
        loaded,
        addTrip: async (trip) => {
          const code = await addTripRequest(trip)
          setUserTrips((prev) => [...prev, trip])
          return code
        },
        updateTrip: async (trip) => {
          const updated = await updateTripRequest(trip)
          setUserTrips((prev) => prev.map((t) => (t.id === trip.id ? updated : t)))
        },
        deleteTrip: async (id) => {
          const code = await deleteTripRequest(id)
          setUserTrips((prev) => prev.filter((t) => t.id !== id))
          return code
        },
        getTrip: (id) => userTrips.find((t) => t.id === id),
        loadTrip: async (id) => {
          const trip = await fetchTripById(id)
          setUserTrips((prev) => prev.map((t) => (t.id === id ? trip : t)))
          return trip
        },
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
