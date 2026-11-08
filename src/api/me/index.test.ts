import { afterEach, describe, expect, it } from 'vitest'

import { apiClient } from '@/api/httpClient/apiClient'
import { fakeAdapter } from '@/api/test-adapter'

import { getMe, updateMe } from '.'

const original = apiClient.defaults.adapter
afterEach(() => {
  apiClient.defaults.adapter = original
})

const user = { id: 'u1', username: 'alice', email: 'a@example.com' }

describe('me api', () => {
  it('getMe returns the user from the envelope', async () => {
    const fake = fakeAdapter({ code: 'JOURNEY-200000', message: 'Success', data: user })
    apiClient.defaults.adapter = fake.adapter
    await expect(getMe()).resolves.toEqual(user)
    expect(fake.requests[0]).toMatchObject({ method: 'get', url: '/api/v1/me' })
  })

  it('updateMe patches only the given fields', async () => {
    const fake = fakeAdapter({ code: 'JOURNEY-200000', message: 'Success', data: user })
    apiClient.defaults.adapter = fake.adapter
    await expect(updateMe({ bio: 'hi' })).resolves.toEqual(user)
    expect(fake.requests[0]).toMatchObject({
      method: 'patch',
      url: '/api/v1/me',
      data: { bio: 'hi' },
    })
  })
})
