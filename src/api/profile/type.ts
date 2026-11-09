import type { JourneyView, PublicProfileType } from '@/api/journey/type'
import type { CalendarEntry } from '@/lib/profile-calendar'

export interface CalendarItemType extends CalendarEntry {
  companions?: PublicProfileType[]
}

export interface ProfileStats {
  countries: number
  cities: number
  trips: number
}

export interface ProfileView {
  user: PublicProfileType
  followers: number
  following: number
  is_following: boolean
  // Absent on older servers.
  follow_requested?: boolean
  follow_approval?: boolean
  is_blocked?: boolean
  now: JourneyView | null
  upcoming: JourneyView[] | null
  calendar: CalendarItemType[] | null
  past: JourneyView[] | null
  stats: ProfileStats
}

export interface FollowState {
  is_following: boolean
  requested?: boolean
  followers: number
}

export interface Envelope<T> {
  code: string
  message: string
  data: T
}
