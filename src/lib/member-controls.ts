import type { MemberRole } from '@/api/members/type'

export interface MemberControls {
  showPanel: boolean
  manageMembers: boolean // change role / remove
  invite: boolean
  inviteRoles: MemberRole[] // roles the viewer may hand out
  manageLinks: boolean // create / copy / list invite links
  revokeLinks: boolean
}

// The API is the real gate. Editors get invite controls only when the trip says they may
// (`editorsCanInvite === true`); unknown hides them.
export const memberControls = (
  role: string | undefined,
  editorsCanInvite?: boolean,
): MemberControls => {
  const owner = role === 'owner'
  const editor = role === 'editor'
  // Editors invite only when the owner allowed it (unknown counts as no).
  const inviter = owner || (editor && editorsCanInvite === true)
  return {
    showPanel: owner || editor || role === 'traveler',
    manageMembers: owner,
    invite: inviter,
    inviteRoles: owner ? ['traveler', 'editor'] : inviter ? ['traveler'] : [],
    manageLinks: inviter,
    revokeLinks: owner,
  }
}
