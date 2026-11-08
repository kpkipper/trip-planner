import type { MemberRole } from '@/api/members/type'

export interface MemberControls {
  showPanel: boolean
  manageMembers: boolean // change role / remove
  invite: boolean
  inviteRoles: MemberRole[] // roles the viewer may hand out
  manageLinks: boolean // create / copy / list invite links
  revokeLinks: boolean
}

// The API is the real gate (editors may only invite when the trip allows it; the trip view
// does not expose that flag, so editors see the controls and a 403 is shown as a toast).
export const memberControls = (role: string | undefined): MemberControls => {
  const owner = role === 'owner'
  const editor = role === 'editor'
  const inviter = owner || editor
  return {
    showPanel: owner || editor || role === 'traveler',
    manageMembers: owner,
    invite: inviter,
    inviteRoles: owner ? ['traveler', 'editor'] : editor ? ['traveler'] : [],
    manageLinks: inviter,
    revokeLinks: owner,
  }
}
