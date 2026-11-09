import { describe, expect, it } from 'vitest'

import { momentControls } from './moment-controls'

import type { MomentView } from '@/api/moments/type'
import type { TripSettings } from '@/types/trip'

const settings = (membersCanPost: boolean): TripSettings => ({
  isDraft: false,
  timezone: 'Asia/Bangkok',
  hideLiveStatus: false,
  editorsCanInvite: false,
  membersCanPost,
})

const moment = (username: string, canDelete = false) =>
  ({ uploader: { username }, can_delete: canDelete }) as unknown as MomentView

describe('momentControls canPost', () => {
  it.each([
    ['owner', false, true],
    ['owner', true, true],
    ['editor', false, false],
    ['editor', true, true],
    ['traveler', false, false],
    ['traveler', true, true],
    ['', true, false],
    [undefined, true, false],
    ['follower', true, false],
  ])('role %s, members_can_post %s -> %s', (role, flag, expected) => {
    expect(momentControls(role, settings(flag), 'me').canPost).toBe(expected)
  })

  it('stranger without settings cannot post; owner still can', () => {
    expect(momentControls(undefined, undefined, 'me').canPost).toBe(false)
    expect(momentControls('editor', undefined, 'me').canPost).toBe(false)
    expect(momentControls('owner', undefined, 'me').canPost).toBe(true)
  })
})

describe('momentControls canDelete', () => {
  it('follows can_delete from the API only', () => {
    expect(momentControls('owner', settings(true), 'me', moment('x', true)).canDelete).toBe(true)
    expect(momentControls('owner', settings(true), 'me', moment('x', false)).canDelete).toBe(false)
    expect(momentControls('owner', settings(true), 'me').canDelete).toBe(false)
  })
})

describe('momentControls canEditCaption', () => {
  it('uploader who is still a member can edit', () => {
    expect(momentControls('traveler', settings(false), 'me', moment('me')).canEditCaption).toBe(
      true,
    )
    expect(momentControls('owner', settings(false), 'me', moment('me')).canEditCaption).toBe(true)
  })
  it('someone else cannot, even the owner', () => {
    expect(momentControls('owner', settings(true), 'me', moment('other')).canEditCaption).toBe(
      false,
    )
  })
  it('uploader who left the trip (non-member) cannot', () => {
    expect(momentControls(undefined, undefined, 'me', moment('me')).canEditCaption).toBe(false)
    expect(momentControls('', undefined, 'me', moment('me')).canEditCaption).toBe(false)
  })
  it('logged-out viewer cannot', () => {
    expect(momentControls('owner', settings(true), undefined, moment('me')).canEditCaption).toBe(
      false,
    )
  })
  it('no moment means no caption editing', () => {
    expect(momentControls('owner', settings(true), 'me').canEditCaption).toBe(false)
  })
})
