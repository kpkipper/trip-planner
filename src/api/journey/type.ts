export type TripStateType = 'planning' | 'upcoming' | 'ongoing' | 'completed'

export interface JourneyStatusType {
  state: TripStateType
  days_until: number
  day_number: number
  total_days: number
}

export interface ListJourneyType {
  id: string
  slug: string
  title: string
  destination: string
  cover_url?: string
  status?: JourneyStatusType
}

export interface ListCountryType {
  country: string
  plan: ListJourneyType[]
}

// One item of GET /me/journeys (no country; carries the viewer's role).
export interface MyJourneyType {
  slug: string
  title: string
  destination: string
  departure_date?: string
  return_date?: string
  cover_url?: string
  role: string
  status?: JourneyStatusType
}

export interface ActivityPlanType {
  id: string
  day_id?: string
  time: string
  description: string
  category?: string
  map_url?: string
  position?: number
  hidden_from_public?: boolean
}

export interface ItineraryDayType {
  id: string
  date: string
  date_iso: string
  title: string
  plans: ActivityPlanType[]
}

export interface PublicProfileType {
  username: string
  display_name: string
  avatar_url: string
  bio: string
}

export interface MemberViewType {
  username: string
  display_name: string
  avatar_url: string
  role: string
  status: string
}

export interface LiveViewType {
  city: string
  day_number: number
  total_days: number
  today_plans?: ActivityPlanType[]
}

// Only returned to members of the trip.
export interface JourneySettingsType {
  is_draft: boolean
  timezone: string
  hide_live_status: boolean
  editors_can_invite: boolean
}

// GET /journeys/:slug. Fields marked optional may be missing; check `redacted` first.
export interface JourneyView {
  id: string
  slug: string
  title: string
  destination: string
  country: string
  cover_url?: string
  visibility?: string
  owner?: PublicProfileType
  status?: JourneyStatusType
  month_start?: string
  month_end?: string
  departure_date?: string
  return_date?: string
  itinerary_days?: ItineraryDayType[]
  members?: MemberViewType[]
  redacted?: boolean
  role?: string
  live?: LiveViewType
  settings?: JourneySettingsType
  created_at?: string
  updated_at?: string
}

export type JourneyType = JourneyView

export interface GetListJourneyResponse {
  code: string
  message: string
  data: ListCountryType[]
}

export interface GetJourneyTripResponse {
  code: string
  message: string
  data: JourneyView
}

export interface Response {
  code: string
  message: string
}

export interface CreateJourneyResponse {
  code: string
  message: string
  data: { slug: string }
}

export interface GetMyJourneysResponse {
  code: string
  message: string
  data: MyJourneyType[]
}
