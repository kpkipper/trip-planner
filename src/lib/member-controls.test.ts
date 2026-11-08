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
  it('editor can invite travelers only, create links but not revoke', () => {
    expect(memberControls('editor')).toEqual({
      showPanel: true,
      manageMembers: false,
      invite: true,
      inviteRoles: ['traveler'],
      manageLinks: true,
      revokeLinks: false,
    })
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
