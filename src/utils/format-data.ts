import type { Trip, TripDay, Activity } from '@/types/trip'
import type { JourneyType, ItineraryDayType, ActivityPlanType, ListCountryType } from '@/api/journey/type'

const toDate = (val?: string): string => val?.split('T')[0] ?? ''

const toActivity = (plan: ActivityPlanType, index: number): Activity => ({
  id: plan.id ?? String(index),
  time: plan.time ?? '',
  description: plan.description ?? '',
  emoji: plan.emoji ?? '📍',
  mapUrl: plan.map_url,
})

const toTripDay = (day: ItineraryDayType, index: number): TripDay => ({
  id: day.id ?? String(index),
  date: day.date ?? '',
  dateISO: toDate(day.date_iso),
  title: day.title ?? '',
  activities: (day.plans ?? []).map(toActivity),
})

export const toTripList = (data: ListCountryType[]): Trip[] =>
  data.flatMap((g) =>
    (g.plan ?? []).map((p) =>
      toTrip({
        ...p,
        country: g.country,
        departure_date: '',
        return_date: '',
        itinerary_days: [],
      }),
    ),
  )

export const toTrip = (journey: JourneyType): Trip => {
  const destParts = (journey.destination ?? '').split(', ')
  const destination =
    destParts.length > 1 ? destParts.slice(0, -1).join(', ') : (journey.destination ?? '')
  return {
    id: journey.id,
    slug: journey.slug ?? '',
    title: journey.title ?? '',
    destination,
    country: journey.country ?? '',
    startDate: toDate(journey.departure_date),
    endDate: toDate(journey.return_date),
    days: (journey.itinerary_days ?? []).map(toTripDay),
    updatedAt: journey.updated_at,
  }
}
