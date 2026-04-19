import type { Trip } from '@/types/trip'

export const mapTripPayload = (trip: Trip) => ({
  title: trip.title,
  country: trip.country,
  destination: `${trip.destination}, ${trip.country}`,
  departure_date: trip.startDate
    ? trip.startDate.includes('T')
      ? trip.startDate
      : `${trip.startDate}T00:00:00Z`
    : undefined,
  return_date: trip.endDate
    ? trip.endDate.includes('T')
      ? trip.endDate
      : `${trip.endDate}T00:00:00Z`
    : undefined,
  itinerary_days: trip.days.map((day) => ({
    date: day.date,
    date_iso: day.dateISO
      ? day.dateISO.includes('T')
        ? day.dateISO
        : `${day.dateISO}T00:00:00Z`
      : undefined,
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
