import { afterEach, describe, expect, it } from 'vitest'

import { apiClient } from '@/api/httpClient/apiClient'
import { fakeAdapter } from '@/api/test-adapter'

import { followUser, getProfile, unfollowUser } from '.'

const original = apiClient.defaults.adapter
afterEach(() => {
  apiClient.defaults.adapter = original
})

const ok = (data: unknown) => ({ code: 'JOURNEY-200000', message: 'Success', data })

describe('profile api', () => {
  it('getProfile unwraps the envelope and encodes the username', async () => {
    const profile = { user: { username: 'a_b' }, followers: 1 }
    const fake = fakeAdapter(ok(profile))
    apiClient.defaults.adapter = fake.adapter
    await expect(getProfile('a_b')).resolves.toEqual(profile)
    expect(fake.requests[0]).toMatchObject({ method: 'get', url: '/api/v1/users/a_b/profile' })
  })
  it('follow posts and unfollow deletes', async () => {
    const fake = fakeAdapter(ok({ is_following: true, followers: 2 }))
    apiClient.defaults.adapter = fake.adapter
    await expect(followUser('bob')).resolves.toEqual({ is_following: true, followers: 2 })
    await unfollowUser('bob')
    expect(fake.requests.map((r) => `${r.method} ${r.url}`)).toEqual([
      'post /api/v1/users/bob/follow',
      'delete /api/v1/users/bob/follow',
    ])
  })
})
