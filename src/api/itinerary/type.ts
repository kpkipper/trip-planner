import type { ActivityPlanType, ItineraryDayType } from '@/api/journey/type'

// Absent fields are left unchanged by the API.
export interface JourneyPatchBody {
  title?: string
  destination?: string
  country?: string
  departure_date?: string
  return_date?: string
}

export interface DayBody {
  date?: string
  date_iso?: string
  title?: string
}

export interface PlanBody {
  time?: string
  description?: string
  map_url?: string
  category?: string
  // Moves the plan to another day of the same trip (appended last).
  day_id?: string
}

export interface ApiResponse<T> {
  code: string
  message: string
  data: T
}

export type DayResponse = ApiResponse<Omit<ItineraryDayType, 'plans'> & { plans?: unknown[] }>
export type PlanResponse = ApiResponse<ActivityPlanType>
