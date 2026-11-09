import type { PublicProfileType } from '@/api/journey/type'

export interface FollowEntry {
  user: PublicProfileType
  created_at: string
}

export interface Envelope<T> {
  code: string
  message: string
  data: T
}
