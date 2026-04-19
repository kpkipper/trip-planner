import type { Trip } from '@/types/trip'
import type { JourneyType, ListCountryType } from '@/api/journey/type'

export const mapTripResponse = (journey: JourneyType): Trip => {
  const destParts = (journey.destination ?? '').split(', ')
  const destination =
    destParts.length > 1 ? destParts.slice(0, -1).join(', ') : (journey.destination ?? '')
  return {
    id: journey.id,
    slug: journey.slug ?? '',
    title: journey.title ?? '',
    destination,
    country: journey.country ?? '',
    startDate: journey.departure_date ? journey.departure_date.split('T')[0] : '',
    endDate: journey.return_date ? journey.return_date.split('T')[0] : '',
    days: (journey.itinerary_days ?? []).map((day, di) => ({
      id: day.id ?? String(di),
      date: day.date ?? '',
      dateISO: day.date_iso ? day.date_iso.split('T')[0] : '',
      title: day.title ?? '',
      activities: (day.plans ?? []).map((plan, pi) => ({
        id: plan.id ?? String(pi),
        time: plan.time ?? '',
        description: plan.description ?? '',
        category: plan.category,
        emoji: plan.emoji ?? '📍',
        mapUrl: plan.map_url,
      })),
    })),
    updatedAt: journey.updated_at ?? new Date().toISOString(),
  }
}

export const formatListJourney = (data: ListCountryType[]): Trip[] => {
  return data.flatMap((g) =>
    (g.plan ?? []).map((p) =>
      mapTripResponse({
        ...p,
        country: g.country,
        departure_date: '',
        return_date: '',
        itinerary_days: [],
      }),
    ),
  )
}

export const formatJourneyDetail = (data: JourneyType): Trip => {
  return mapTripResponse(data)
}
