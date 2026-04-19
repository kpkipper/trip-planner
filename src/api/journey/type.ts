export interface ListJourneyType {
  id: string
  slug: string
  title: string
  destination: string
}

export interface ListCountryType {
  country: string
  plan: ListJourneyType[]
}

export interface ActivityPlanType {
  id: string
  time: string
  description: string
  category?: string
  emoji?: string
  map_url?: string
}

export interface ItineraryDayType {
  id: string
  date: string
  date_iso: string
  title: string
  plans: ActivityPlanType[]
}

export interface JourneyType {
  id: string
  slug: string
  title: string
  country: string
  destination: string
  departure_date: string
  return_date: string
  itinerary_days: ItineraryDayType[]
  created_at?: string
  updated_at?: string
}

export interface GetListJourneyResponse {
  code: string
  message: string
  data: ListCountryType[]
}

export interface GetJourneyTripResponse {
  code: string
  message: string
  data: JourneyType
}

export interface Response {
  code: string
  message: string
}
