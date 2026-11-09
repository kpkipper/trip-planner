import type { PublicProfileType } from '@/api/journey/type'

export interface Envelope<T> {
  code?: string
  message?: string
  data: T
}

export type FeedItemType = 'trip_planned' | 'trip_started' | 'moments_added' | 'trip_completed'

export interface FeedTrip {
  slug: string
  title: string
  destination: string
  country: string
  cover_url: string
  departure_date?: string
  return_date?: string
}

export interface FeedItem {
  id: string
  type: FeedItemType
  at: string
  actor: PublicProfileType
  trip: FeedTrip
  companions: PublicProfileType[]
  moments?: { count: number; day_id: string; day_title: string; thumbs: string[] }
}

export interface FeedPage {
  items: FeedItem[]
  next_before: string | null
}

export interface NowTraveler {
  user: PublicProfileType
  trip: FeedTrip
  day_number: number
  total_days: number
}
