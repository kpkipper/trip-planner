import { afterEach, describe, expect, it } from 'vitest'

import { apiClient } from '@/api/httpClient/apiClient'
import { fakeAdapter } from '@/api/test-adapter'

import {
  acceptFollowRequest,
  declineFollowRequest,
  listFollowers,
  listFollowRequests,
  removeFollower,
} from '.'

const original = apiClient.defaults.adapter
afterEach(() => {
  apiClient.defaults.adapter = original
})

const use = (data: unknown, status = 200) => {
  const fake = fakeAdapter({ code: 'JOURNEY-200000', message: 'Success', data }, status)
  apiClient.defaults.adapter = fake.adapter
  return fake.requests
}

describe('follows api', () => {
  it('listFollowRequests returns items and count, null items become []', async () => {
    const requests = use({ items: [{ user: { username: 'x' }, created_at: 't' }], count: 1 })
    await expect(listFollowRequests()).resolves.toEqual({
      items: [{ user: { username: 'x' }, created_at: 't' }],
      count: 1,
    })
    expect(requests[0]).toMatchObject({ method: 'get', url: '/api/v1/me/follow-requests' })
    use({ items: null, count: 0 })
    await expect(listFollowRequests()).resolves.toEqual({ items: [], count: 0 })
  })

  it('listFollowRequests forwards skipAuthRedirect', async () => {
    const requests = use({ items: [], count: 0 })
    await listFollowRequests({ skipAuthRedirect: true })
    expect(requests[0].skipAuthRedirect).toBe(true)
  })

  it('accept and decline encode the username', async () => {
    const requests = use(null, 204)
    await acceptFollowRequest('a b')
    await declineFollowRequest('a b')
    expect(requests[0]).toMatchObject({
      method: 'post',
      url: '/api/v1/me/follow-requests/a%20b/accept',
    })
    expect(requests[1]).toMatchObject({ method: 'delete', url: '/api/v1/me/follow-requests/a%20b' })
  })

  it('listFollowers unwraps items, null becomes []', async () => {
    let requests = use({ items: [{ user: { username: 'x' }, created_at: 't' }] })
    await expect(listFollowers()).resolves.toHaveLength(1)
    expect(requests[0]).toMatchObject({ method: 'get', url: '/api/v1/me/followers' })
    requests = use({ items: null })
    await expect(listFollowers()).resolves.toEqual([])
  })

  it('removeFollower encodes the username', async () => {
    const requests = use(null, 204)
    await removeFollower('a b')
    expect(requests[0]).toMatchObject({ method: 'delete', url: '/api/v1/me/followers/a%20b' })
  })
})
