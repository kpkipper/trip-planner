import { describe, expect, it } from 'vitest'

import { buildSettingsPatch, settingsAccess, VISIBILITY_OPTIONS } from './trip-settings'

const keep = { hideLiveStatus: 'keep', editorsCanInvite: 'keep', draft: 'keep' } as const

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
    expect(settingsAccess('owner')).toEqual({
      visibility: true,
      hideLiveStatus: true,
      editorsCanInvite: true,
      cover: true,
      draft: true,
      timezone: true,
    })
  })
  it('editor sees only draft and timezone', () => {
    expect(settingsAccess('editor')).toEqual({
      visibility: false,
      hideLiveStatus: false,
      editorsCanInvite: false,
      cover: false,
      draft: true,
      timezone: true,
    })
  })
  it('others see nothing', () => {
    for (const role of ['traveler', 'follower', '', undefined]) {
      expect(Object.values(settingsAccess(role)).some(Boolean)).toBe(false)
    }
  })
})

describe('buildSettingsPatch', () => {
  const original = { visibility: 'followers', coverUrl: 'https://a.example/c.jpg' }
  const base = {
    visibility: 'followers',
    coverUrl: 'https://a.example/c.jpg',
    timezone: '',
    ...keep,
  }

  it('is empty when nothing changed', () => {
    expect(buildSettingsPatch('owner', base, original)).toEqual({})
  })
  it('sends only changed fields', () => {
    expect(
      buildSettingsPatch(
        'owner',
        { ...base, visibility: 'private', hideLiveStatus: 'on', timezone: 'Asia/Tokyo' },
        original,
      ),
    ).toEqual({ visibility: 'private', hide_live_status: true, timezone: 'Asia/Tokyo' })
  })
  it('maps off to false and clears the cover with an empty string', () => {
    expect(
      buildSettingsPatch(
        'owner',
        { ...base, editorsCanInvite: 'off', draft: 'on', coverUrl: ' ' },
        original,
      ),
    ).toEqual({ editors_can_invite: false, is_draft: true, cover_url: '' })
  })
  it('never sends owner-only fields for editors', () => {
    expect(
      buildSettingsPatch(
        'editor',
        {
          visibility: 'public',
          coverUrl: 'https://b.example/x.jpg',
          timezone: 'Asia/Seoul',
          hideLiveStatus: 'on',
          editorsCanInvite: 'on',
          draft: 'off',
        },
        original,
      ),
    ).toEqual({ timezone: 'Asia/Seoul', is_draft: false })
  })
})

describe('cover validation', () => {
  it('accepts empty and https, rejects other schemes', async () => {
    const { coverError } = await import('./trip-settings')
    expect(coverError('')).toBeNull()
    expect(coverError('https://a.example/x.png')).toBeNull()
    expect(coverError('http://a.example/x.png')).not.toBeNull()
    expect(coverError('javascript:alert(1)')).not.toBeNull()
    expect(coverError('https://a.example/' + 'x'.repeat(2048))).not.toBeNull()
  })
})
