'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { usePathname } from 'next/navigation'

import { getJourneys, getMyJourneys } from '@/api/journey'
import { errorSummary } from '@/lib/error-summary'
import { toTripList, toTripListFromMine } from '@/utils/format-data'

import { useAuth } from './auth-context'

import type { Trip } from '@/types/trip'

interface TripsContextValue {
  // Anonymous: the public list. Logged in: the trips I own or joined (newest departure first).
  trips: Trip[]
  // Logged in only: split by the viewer's role.
  myTrips: Trip[]
  sharedTrips: Trip[]
  loaded: boolean
  // The latest fetch failed (the list then holds whatever was there before, possibly nothing).
  error: boolean
  // Fetch the list again (e.g. a Retry button after an error).
  reload: () => void
}

const EMPTY_TRIPS: Trip[] = []

const TripsContext = createContext<TripsContextValue | null>(null)

export function TripsProvider({ children }: { children: React.ReactNode }) {
  // The list remembers whether it was fetched logged in, so a stale list is never shown
  // under the other login state (e.g. the public list under "Shared with me").
  const [fetched, setFetched] = useState<{ list: Trip[]; authed: boolean }>({
    list: [],
    authed: false,
  })
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const pathname = usePathname()
  const { status } = useAuth()
  // Refetch when the page or the login state changes (login/logout changes what is visible).
  const loadKey = `${status}:${pathname}`
  const [loadedKey, setLoadedKey] = useState(loadKey)

  // Mark as loading again as soon as the key changes, before the refetch below.
  if (loadedKey !== loadKey) {
    setLoadedKey(loadKey)
    setLoaded(false)
    setError(false)
  }

  const reload = useCallback(() => {
    setLoaded(false)
    setError(false)
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    // Wait until we know whether the user is logged in, so the list is fetched once.
    if (status === 'loading') return
    let cancelled = false
    const request =
      status === 'authed'
        ? getMyJourneys().then(toTripListFromMine)
        : getJourneys().then(({ data }) => toTripList(data ?? []))
    request
      .then((list) => {
        if (cancelled) return
        setFetched({ list, authed: status === 'authed' })
        setError(false)
      })
      .catch((err) => {
        console.error('Failed to load trips:', errorSummary(err))
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [pathname, status, attempt])

  const authed = status === 'authed'
  const userTrips = fetched.authed === authed ? fetched.list : EMPTY_TRIPS
  const value = useMemo(
    () => ({
      trips: userTrips,
      myTrips: authed ? userTrips.filter((t) => t.role === 'owner') : [],
      sharedTrips: authed ? userTrips.filter((t) => t.role !== 'owner') : [],
      loaded,
      error,
      reload,
    }),
    [userTrips, authed, loaded, error, reload],
  )

  return <TripsContext.Provider value={value}>{children}</TripsContext.Provider>
}

export function useTrips() {
  const ctx = useContext(TripsContext)
  if (!ctx) throw new Error('useTrips must be used within TripsProvider')
  return ctx
}
