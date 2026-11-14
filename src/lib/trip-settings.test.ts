import { describe, expect, it } from 'vitest'

import {
  buildSettingsPatch,
  formFromTrip,
  settingsAccess,
  VISIBILITY_OPTIONS,
} from './trip-settings'

const settings = {
  isDraft: false,
  timezone: 'Asia/Bangkok',
  hideLiveStatus: false,
  editorsCanInvite: false,
  membersCanPost: false,
}
const original = {
  visibility: 'followers',
  settings,
}

describe('VISIBILITY_OPTIONS', () => {
  it('has the four levels with a description each', () => {
    expect(VISIBILITY_OPTIONS.map((o) => o.value)).toEqual([
      'public',
      'followers',
      'link',
      'private',
    ])
    expect(VISIBILITY_OPTIONS.every((o) => o.description.length > 0)).toBe(true)
  })
})

describe('settingsAccess', () => {
  it('owner sees everything', () => {
    expect(settingsAccess('owner', true)).toEqual({
      visibility: true,
      hideLiveStatus: true,
      editorsCanInvite: true,
      membersCanPost: true,
      cover: true,
      draft: true,
      timezone: true,
    })
  })
  it('editor sees only draft and timezone', () => {
    expect(settingsAccess('editor', true)).toEqual({
      visibility: false,
      hideLiveStatus: false,
      editorsCanInvite: false,
      membersCanPost: false,
      cover: false,
      draft: true,
      timezone: true,
    })
  })
  it('hides controls whose current value is unknown when settings are absent', () => {
    expect(settingsAccess('owner', false)).toEqual({
      visibility: true,
      hideLiveStatus: false,
      editorsCanInvite: false,
      membersCanPost: false,
      cover: true,
      draft: false,
      timezone: false,
    })
    expect(Object.values(settingsAccess('editor', false)).some(Boolean)).toBe(false)
  })
  it('others see nothing', () => {
    for (const role of ['traveler', 'follower', '', undefined]) {
      expect(Object.values(settingsAccess(role, true)).some(Boolean)).toBe(false)
    }
  })
})

describe('formFromTrip', () => {
  it('starts from the trip values, never assuming a visibility', () => {
    expect(formFromTrip(original)).toEqual({
      visibility: 'followers',
      timezone: 'Asia/Bangkok',
      hideLiveStatus: false,
      editorsCanInvite: false,
      membersCanPost: false,
      draft: false,
    })
    expect(formFromTrip({}).visibility).toBe('')
  })
})

describe('buildSettingsPatch', () => {
  const base = formFromTrip(original)

  it('is empty when nothing changed', () => {
    expect(buildSettingsPatch('owner', base, original)).toEqual({})
  })
  it('sends only changed fields', () => {
    expect(
      buildSettingsPatch(
        'owner',
        { ...base, visibility: 'private', hideLiveStatus: true, timezone: 'Asia/Tokyo' },
        original,
      ),
    ).toEqual({ visibility: 'private', hide_live_status: true, timezone: 'Asia/Tokyo' })
  })
  it('sends false when a flag is switched off', () => {
    const on = { ...original, settings: { ...settings, editorsCanInvite: true, isDraft: true } }
    expect(
      buildSettingsPatch(
        'owner',
        { ...formFromTrip(on), editorsCanInvite: false, draft: false },
        on,
      ),
    ).toEqual({ editors_can_invite: false, is_draft: false })
  })
  it('sends members_can_post only when it changed, and only for the owner', () => {
    const form = { ...formFromTrip(original), membersCanPost: true }
    expect(buildSettingsPatch('owner', form, original)).toEqual({ members_can_post: true })
    expect(buildSettingsPatch('editor', form, original)).toEqual({})
    expect(buildSettingsPatch('owner', formFromTrip(original), original)).toEqual({})
  })
  it('never sends owner-only fields for editors', () => {
    expect(
      buildSettingsPatch(
        'editor',
        {
          visibility: 'public',
          timezone: 'Asia/Seoul',
          hideLiveStatus: true,
          editorsCanInvite: true,
          membersCanPost: true,
          draft: true,
        },
        original,
      ),
    ).toEqual({ timezone: 'Asia/Seoul', is_draft: true })
  })
  it('sends nothing for settings that are unknown', () => {
    const noSettings = { visibility: 'followers' }
    expect(
      buildSettingsPatch(
        'owner',
        { ...formFromTrip(noSettings), hideLiveStatus: true },
        noSettings,
      ),
    ).toEqual({})
  })
})
