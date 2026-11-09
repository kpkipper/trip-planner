import type { MomentView } from '@/api/moments/type'
import type { TripSettings } from '@/types/trip'

export interface MomentControls {
  canPost: boolean
  canDelete: boolean
  canEditCaption: boolean
}

const MEMBER_ROLES = ['owner', 'editor', 'traveler']

// The API is the real gate; this only decides which buttons to show.
export const momentControls = (
  role: string | undefined,
  settings: TripSettings | undefined,
  currentUsername: string | undefined,
  moment?: MomentView,
): MomentControls => {
  const member = !!role && MEMBER_ROLES.includes(role)
  return {
    canPost:
      role === 'owner' ||
      ((role === 'editor' || role === 'traveler') && !!settings?.membersCanPost),
    canDelete: !!moment?.can_delete,
    canEditCaption:
      !!moment && member && !!currentUsername && moment.uploader.username === currentUsername,
  }
}
