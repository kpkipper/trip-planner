import type { JourneyStatusType } from '@/api/journey/type'

export interface Activity {
  id: string
  time: string
  description: string
  mapUrl?: string
  category?: string
  hiddenFromPublic?: boolean
}

export interface TripDay {
  id: string
  date: string
  dateISO: string
  title: string
  activities: Activity[]
}

export interface TripPerson {
  username: string
  displayName: string
  avatarUrl: string
  bio?: string
}

export interface TripMember extends TripPerson {
  role: string
  status: string
}

export interface TripLive {
  city: string
  dayNumber: number
  totalDays: number
  todayPlans?: Activity[]
}

export interface TripSettings {
  isDraft: boolean
  timezone: string
  hideLiveStatus: boolean
  editorsCanInvite: boolean
}

export interface Trip {
  id?: string
  slug?: string
  title: string
  destination: string
  country: string
  startDate: string
  endDate: string
  days: TripDay[]
  updatedAt?: string
  // Set by the privacy-aware API; missing on trips built in the create form.
  redacted?: boolean
  role?: string
  visibility?: string
  timezone?: string
  // Members only; absent for followers and strangers.
  settings?: TripSettings
  status?: JourneyStatusType
  owner?: TripPerson
  members?: TripMember[]
  live?: TripLive
  coverUrl?: string
  monthStart?: string
  monthEnd?: string
}
