import { describe, expect, it } from 'vitest'

import { memberControls } from './member-controls'

describe('memberControls', () => {
  it('owner manages everything and may pick any role', () => {
    expect(memberControls('owner')).toEqual({
      showPanel: true,
      manageMembers: true,
      invite: true,
      inviteRoles: ['traveler', 'editor'],
      manageLinks: true,
      revokeLinks: true,
    })
  })
  it('editor can invite travelers only, create links but not revoke, when the trip allows it', () => {
    expect(memberControls('editor', true)).toEqual({
      showPanel: true,
      manageMembers: false,
      invite: true,
      inviteRoles: ['traveler'],
      manageLinks: true,
      revokeLinks: false,
    })
  })
  it('editor sees the list only unless editors_can_invite is true', () => {
    for (const flag of [false, undefined]) {
      expect(memberControls('editor', flag)).toMatchObject({
        showPanel: true,
        invite: false,
        manageLinks: false,
        inviteRoles: [],
      })
    }
  })
  it('traveler sees the list only', () => {
    expect(memberControls('traveler')).toEqual({
      showPanel: true,
      manageMembers: false,
      invite: false,
      inviteRoles: [],
      manageLinks: false,
      revokeLinks: false,
    })
  })
  it('no role hides the panel', () => {
    for (const role of ['', undefined, 'stranger']) {
      expect(memberControls(role).showPanel).toBe(false)
      expect(memberControls(role).invite).toBe(false)
    }
  })
})
