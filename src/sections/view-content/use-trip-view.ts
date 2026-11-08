import { useEffect, useState, useSyncExternalStore } from 'react'

import { useRouter } from 'next/navigation'

import { deleteJourney, getJourneyBySlug, leaveJourney } from '@/api/journey'
import { useToast } from '@/contexts/toast-context'
import { useTrips } from '@/contexts/trips-context'
import { errorSummary } from '@/lib/error-summary'
import { classifyLoadError } from '@/lib/load-error'
import { toTrip } from '@/utils/format-data'

import type { Trip } from '@/types/trip'

const MINUTE = 60_000

// Ticks once a minute. The server snapshot is null so SSG output and hydration match.
const subscribeToMinute = (onTick: () => void) => {
  const interval = setInterval(onTick, MINUTE)
  return () => clearInterval(interval)
}
const getCurrentMinute = () => Math.floor(Date.now() / MINUTE)
const getServerMinute = () => null

export function useTripView(slug: string) {
  const router = useRouter()
  const { showToast } = useToast()
  const { trips } = useTrips()

  const [trip, setTrip] = useState<Trip>()
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const currentMinute = useSyncExternalStore(subscribeToMinute, getCurrentMinute, getServerMinute)
  const currentTime = currentMinute === null ? null : new Date(currentMinute * MINUTE)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const res = await getJourneyBySlug(slug)
        if (cancelled) return
        if (classifyLoadError(undefined, res)) {
          setNotFound(true)
          return
        }
        const trip = toTrip(res.data)
        setTrip(trip)
        const now = new Date()
        const todayIndex = trip.days.findIndex(
          (d) => new Date(d.dateISO + 'T12:00:00').toDateString() === now.toDateString(),
        )
        if (todayIndex >= 0) setSelectedDayIndex(todayIndex)
      } catch (err) {
        if (cancelled) return
        const kind = classifyLoadError(err)
        if (kind === 'forbidden') showToast("You don't have access", 'error')
        else if (kind === 'error') showToast('Something went wrong. Please try again.', 'error')
        // 404 (including hidden trips), 403 and other failures all show the not-found page.
        setNotFound(true)
        console.error('Failed to load trip:', errorSummary(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [slug, showToast])

  const isCurrentActivity = (dayIdx: number, actIdx: number): boolean => {
    if (!currentTime || !trip) return false
    const day = trip.days[dayIdx]
    const act = day.activities[actIdx]
    if (!act.time) return false
    const actStart = new Date(`${day.dateISO}T${act.time}:00`)
    const nextAct = day.activities[actIdx + 1]
    const nextStart = nextAct?.time ? new Date(`${day.dateISO}T${nextAct.time}:00`) : null
    if (nextStart) return currentTime >= actStart && currentTime < nextStart
    return currentTime >= actStart && currentTime < new Date(actStart.getTime() + 60 * 60 * 1000)
  }

  const goToLatestRemaining = () => {
    const remaining = trips
      .filter((t) => t.slug !== trip!.slug)
      .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime())
    router.replace(remaining.length > 0 ? `/plans/${remaining[0].slug}` : '/plans/create')
  }

  const handleDelete = async () => {
    setConfirmOpen(false)
    setDeleting(true)
    try {
      const { code } = await deleteJourney(trip!.slug!)
      if (code === 'JOURNEY-200000') showToast('Trip deleted successfully!')
      goToLatestRemaining()
    } catch (err) {
      setDeleting(false)
      const kind = classifyLoadError(err)
      showToast(
        kind === 'forbidden' ? "You don't have access" : 'Could not delete the trip',
        'error',
      )
      console.error('Failed to delete trip:', errorSummary(err))
    }
  }

  const handleLeave = async () => {
    setLeaveOpen(false)
    setDeleting(true)
    try {
      await leaveJourney(trip!.slug!)
      showToast('You left the trip')
      router.replace('/')
    } catch (err) {
      setDeleting(false)
      showToast('Could not leave the trip', 'error')
      console.error('Failed to leave trip:', errorSummary(err))
    }
  }

  return {
    trip,
    selectedDayIndex,
    setSelectedDayIndex,
    confirmOpen,
    setConfirmOpen,
    deleting,
    loading,
    notFound,
    isCurrentActivity,
    handleDelete,
    leaveOpen,
    setLeaveOpen,
    handleLeave,
  }
}
