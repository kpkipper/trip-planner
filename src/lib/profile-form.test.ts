import { describe, expect, it } from 'vitest'

import { buildProfilePatch, validateProfile } from './profile-form'

const ok = { username: 'alice_1', displayName: 'Alice', bio: 'hi', avatarUrl: '' }

describe('validateProfile', () => {
  it('accepts a valid form (username is lowercased)', () => {
    expect(validateProfile(ok)).toEqual({})
    expect(validateProfile({ ...ok, username: 'Alice_1' })).toEqual({})
  })
  it('rejects bad usernames', () => {
    for (const username of ['ab', 'a'.repeat(21), 'bad name', 'dash-ed', 'ünï']) {
      expect(validateProfile({ ...ok, username }).username).toBeTruthy()
    }
    expect(validateProfile({ ...ok, username: 'abc' })).toEqual({})
    expect(validateProfile({ ...ok, username: 'a'.repeat(20) })).toEqual({})
  })
  it('limits display name to 50 and bio to 160 characters', () => {
    expect(validateProfile({ ...ok, displayName: 'x'.repeat(50) })).toEqual({})
    expect(validateProfile({ ...ok, displayName: 'x'.repeat(51) }).displayName).toBeTruthy()
    expect(validateProfile({ ...ok, bio: 'x'.repeat(160) })).toEqual({})
    expect(validateProfile({ ...ok, bio: 'x'.repeat(161) }).bio).toBeTruthy()
  })
  it('counts characters, not UTF-16 units', () => {
    expect(validateProfile({ ...ok, bio: '😀'.repeat(160) })).toEqual({})
  })
  it('requires https avatar urls up to 2048 bytes, allows empty', () => {
    expect(validateProfile({ ...ok, avatarUrl: 'https://a.example/p.png' })).toEqual({})
    expect(validateProfile({ ...ok, avatarUrl: 'http://a.example/p.png' }).avatarUrl).toBeTruthy()
    expect(validateProfile({ ...ok, avatarUrl: 'javascript:1' }).avatarUrl).toBeTruthy()
    expect(
      validateProfile({ ...ok, avatarUrl: 'https://a.example/' + 'x'.repeat(2048) }).avatarUrl,
    ).toBeTruthy()
  })
})

describe('buildProfilePatch', () => {
  const user = { username: 'alice', display_name: 'Alice', bio: 'hi', avatar_url: '' }
  it('sends only changed fields, lowercasing the username', () => {
    expect(
      buildProfilePatch(
        { username: 'Alice', displayName: 'Alice', bio: 'new', avatarUrl: '' },
        user,
      ),
    ).toEqual({ bio: 'new' })
    expect(buildProfilePatch({ ...ok, username: 'bob' }, user)).toEqual({ username: 'bob' })
  })
  it('is empty when nothing changed', () => {
    expect(
      buildProfilePatch(
        { username: 'alice', displayName: 'Alice', bio: 'hi', avatarUrl: '' },
        user,
      ),
    ).toEqual({})
  })
})
