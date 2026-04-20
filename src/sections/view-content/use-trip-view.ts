import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { deleteJourney, getJourneyBySlug } from '@/api/journey'
import { useToast } from '@/contexts/toast-context'
import { useTrips } from '@/contexts/trips-context'
import { toTrip } from '@/utils/format-data'

import type { Trip } from '@/types/trip'

export function useTripView(slug: string) {
  const router = useRouter()
  const { showToast } = useToast()
  const { trips } = useTrips()

  const [trip, setTrip] = useState<Trip>()
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    setCurrentTime(new Date())
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getJourneyBySlug(slug)
        if (res.code === 'JOURNEY-404000') {
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
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [slug])

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

  const handleDelete = async () => {
    setConfirmOpen(false)
    setDeleting(true)
    const { code } = await deleteJourney(trip!.slug!)
    if (code === 'JOURNEY-200000') showToast('Trip deleted successfully!')
    const remaining = trips
      .filter((t) => t.slug !== trip!.slug)
      .sort((a, b) => new Date(b.updatedAt ?? 0).getTime() - new Date(a.updatedAt ?? 0).getTime())
    router.replace(remaining.length > 0 ? `/plans/${remaining[0].slug}` : '/plans/create')
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
  }
}
