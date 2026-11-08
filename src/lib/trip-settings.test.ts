import { describe, expect, it } from 'vitest'

import {
  buildSettingsPatch,
  coverError,
  formFromTrip,
  settingsAccess,
  VISIBILITY_OPTIONS,
} from './trip-settings'

const settings = {
  isDraft: false,
  timezone: 'Asia/Bangkok',
  hideLiveStatus: false,
  editorsCanInvite: false,
}
const original = {
  visibility: 'followers',
  coverUrl: 'https://a.example/c.jpg',
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
      coverUrl: 'https://a.example/c.jpg',
      timezone: 'Asia/Bangkok',
      hideLiveStatus: false,
      editorsCanInvite: false,
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
  it('sends false when a flag is switched off and clears the cover with an empty string', () => {
    const on = { ...original, settings: { ...settings, editorsCanInvite: true, isDraft: true } }
    expect(
      buildSettingsPatch(
        'owner',
        { ...formFromTrip(on), editorsCanInvite: false, draft: false, coverUrl: ' ' },
        on,
      ),
    ).toEqual({ editors_can_invite: false, is_draft: false, cover_url: '' })
  })
  it('never sends owner-only fields for editors', () => {
    expect(
      buildSettingsPatch(
        'editor',
        {
          visibility: 'public',
          coverUrl: 'https://b.example/x.jpg',
          timezone: 'Asia/Seoul',
          hideLiveStatus: true,
          editorsCanInvite: true,
          draft: true,
        },
        original,
      ),
    ).toEqual({ timezone: 'Asia/Seoul', is_draft: true })
  })
  it('sends nothing for settings that are unknown', () => {
    const noSettings = { visibility: 'followers', coverUrl: '' }
    expect(
      buildSettingsPatch(
        'owner',
        { ...formFromTrip(noSettings), hideLiveStatus: true },
        noSettings,
      ),
    ).toEqual({})
  })
})

describe('coverError', () => {
  it('accepts empty and https, rejects other schemes', () => {
    expect(coverError('')).toBeNull()
    expect(coverError('https://a.example/x.png')).toBeNull()
    expect(coverError('http://a.example/x.png')).not.toBeNull()
    expect(coverError('javascript:alert(1)')).not.toBeNull()
  })
  it('limits the length in bytes, not characters', () => {
    expect(coverError('https://a.example/' + 'x'.repeat(2048))).not.toBeNull()
    // 1000 two-byte characters fit in characters but not in bytes once the prefix is added.
    expect(coverError('https://a.example/' + 'é'.repeat(1020))).not.toBeNull()
    expect(coverError('https://a.example/' + 'x'.repeat(2000))).toBeNull()
  })
})
