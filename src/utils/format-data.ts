import type {
  ActivityPlanType,
  ItineraryDayType,
  JourneyView,
  ListCountryType,
  MyJourneyType,
  PublicProfileType,
} from '@/api/journey/type'
import type { Activity, Trip, TripDay, TripPerson } from '@/types/trip'

const toDate = (val?: string): string => val?.split('T')[0] ?? ''

const toActivity = (plan: ActivityPlanType, index: number): Activity => ({
  id: plan.id ?? String(index),
  time: plan.time ?? '',
  description: plan.description ?? '',
  mapUrl: plan.map_url || undefined,
  category: plan.category || undefined,
  hiddenFromPublic: plan.hidden_from_public,
})

const toTripDay = (day: ItineraryDayType, index: number): TripDay => ({
  id: day.id ?? String(index),
  date: day.date ?? '',
  dateISO: toDate(day.date_iso),
  title: day.title ?? '',
  activities: (day.plans ?? []).map(toActivity),
})

const toPerson = (p: PublicProfileType): TripPerson => ({
  username: p.username ?? '',
  displayName: p.display_name ?? '',
  avatarUrl: p.avatar_url ?? '',
  bio: p.bio,
})

// The API returns "City, Country"; the form keeps only the city part.
const toDestination = (raw: string | undefined): string => {
  const parts = (raw ?? '').split(', ')
  return parts.length > 1 ? parts.slice(0, -1).join(', ') : (raw ?? '')
}

export const toTripList = (data: ListCountryType[]): Trip[] =>
  data.flatMap((g) =>
    (g.plan ?? []).map((p): Trip => ({
      id: p.id,
      slug: p.slug ?? '',
      title: p.title ?? '',
      destination: toDestination(p.destination),
      country: g.country,
      startDate: '',
      endDate: '',
      days: [],
      coverUrl: p.cover_url || undefined,
      status: p.status,
    })),
  )

export const toTripListFromMine = (data: MyJourneyType[]): Trip[] =>
  data.map((p): Trip => ({
    slug: p.slug ?? '',
    title: p.title ?? '',
    destination: toDestination(p.destination),
    country: '',
    startDate: toDate(p.departure_date),
    endDate: toDate(p.return_date),
    days: [],
    role: p.role ?? '',
    coverUrl: p.cover_url || undefined,
    status: p.status,
  }))

// Handles full, redacted (no days, no dates) and legacy (no owner/status) views.
export const toTrip = (journey: JourneyView): Trip => {
  const live = journey.live
  return {
    id: journey.id,
    slug: journey.slug ?? '',
    title: journey.title ?? '',
    destination: toDestination(journey.destination),
    country: journey.country ?? '',
    startDate: toDate(journey.departure_date),
    endDate: toDate(journey.return_date),
    days: (journey.itinerary_days ?? []).map(toTripDay),
    updatedAt: journey.updated_at,
    redacted: journey.redacted ?? false,
    role: journey.role ?? '',
    visibility: journey.visibility,
    status: journey.status,
    owner: journey.owner ? toPerson(journey.owner) : undefined,
    members: journey.members?.map((m) => ({
      ...toPerson({ ...m, bio: '' }),
      bio: undefined,
      role: m.role,
      status: m.status,
    })),
    live: live
      ? {
          city: live.city ?? '',
          dayNumber: live.day_number,
          totalDays: live.total_days,
          todayPlans: live.today_plans?.map(toActivity),
        }
      : undefined,
    settings: journey.settings
      ? {
          isDraft: journey.settings.is_draft,
          timezone: journey.settings.timezone,
          hideLiveStatus: journey.settings.hide_live_status,
          editorsCanInvite: journey.settings.editors_can_invite,
          membersCanPost: journey.settings.members_can_post ?? false,
        }
      : undefined,
    coverUrl: journey.cover_url || undefined,
    monthStart: journey.month_start,
    monthEnd: journey.month_end,
  }
}
