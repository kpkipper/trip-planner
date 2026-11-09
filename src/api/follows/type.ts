import type { PublicProfileType } from '@/api/journey/type'

export interface FollowEntry {
  user: PublicProfileType
  created_at: string
}
