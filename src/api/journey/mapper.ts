import type { Trip } from '@/types/trip'

const toISODate = (val?: string): string | undefined => {
  if (!val) return undefined
  return val.includes('T') ? val : `${val}T00:00:00Z`
}

export const toJourneyPayload = (trip: Trip) => ({
  title: trip.title,
  country: trip.country,
  destination: `${trip.destination}`,
  departure_date: toISODate(trip.startDate),
  return_date: toISODate(trip.endDate),
  itinerary_days: trip.days.map((day) => ({
    date: day.date,
    date_iso: toISODate(day.dateISO),
    title: day.title,
    plans: day.activities.map((act, i) => ({
      time: act.time,
      description: act.description,
      emoji: act.emoji ?? '📍',
      map_url: act.mapUrl,
      sort_order: i + 1,
    })),
  })),
})
