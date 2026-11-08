import { afterEach, describe, expect, it } from 'vitest'

import { apiClient } from '@/api/httpClient/apiClient'
import { fakeAdapter } from '@/api/test-adapter'

import {
  acceptInvite,
  changeRole,
  createInviteLink,
  declineInvite,
  invite,
  joinByLink,
  listInviteLinks,
  listMembers,
  myInvites,
  removeMember,
  revokeInviteLink,
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

describe('members api', () => {
  it('listMembers encodes the slug and returns the list', async () => {
    const requests = use([{ username: 'a' }])
    await expect(listMembers('a/b c')).resolves.toEqual([{ username: 'a' }])
    expect(requests[0]).toMatchObject({ method: 'get', url: '/api/v1/journeys/a%2Fb%20c/members' })
  })

  it('invite posts username and role', async () => {
    const requests = use({ username: 'bob', status: 'invited' })
    await invite('trip', 'bob', 'traveler')
    expect(requests[0]).toMatchObject({
      method: 'post',
      url: '/api/v1/journeys/trip/members',
      data: { username: 'bob', role: 'traveler' },
    })
  })

  it('changeRole and removeMember encode the username', async () => {
    const requests = use({})
    await changeRole('trip', 'a b', 'editor')
    await removeMember('trip', 'a b')
    expect(requests[0]).toMatchObject({
      method: 'patch',
      url: '/api/v1/journeys/trip/members/a%20b',
      data: { role: 'editor' },
    })
    expect(requests[1]).toMatchObject({
      method: 'delete',
      url: '/api/v1/journeys/trip/members/a%20b',
    })
  })

  it('invite links: list, create (url + link), revoke', async () => {
    let requests = use([{ id: 'l1', role: 'traveler', expires_at: 'x' }])
    await expect(listInviteLinks('trip')).resolves.toHaveLength(1)
    expect(requests[0].url).toBe('/api/v1/journeys/trip/invite-links')

    requests = use({ url: 'https://x/join/t', link: { id: 'l2', role: 'editor', expires_at: 'y' } })
    const created = await createInviteLink('trip', 'editor')
    expect(created.url).toBe('https://x/join/t')
    expect(requests[0]).toMatchObject({ method: 'post', data: { role: 'editor' } })

    requests = use({})
    await revokeInviteLink('trip', 'l/2')
    expect(requests[0]).toMatchObject({
      method: 'delete',
      url: '/api/v1/journeys/trip/invite-links/l%2F2',
    })
  })

  it('joinByLink sends the token in the body, not the URL', async () => {
    const requests = use({ slug: 'trip' })
    await expect(joinByLink('tok')).resolves.toBe('trip')
    expect(requests[0]).toMatchObject({
      method: 'post',
      url: '/api/v1/invites/join',
      data: { token: 'tok' },
    })
  })

  it('my invites: list, accept, decline', async () => {
    let requests = use([{ id: 'i1' }])
    await expect(myInvites()).resolves.toEqual([{ id: 'i1' }])
    expect(requests[0].url).toBe('/api/v1/me/invites')
    requests = use({})
    await acceptInvite('i/1')
    await declineInvite('i1')
    expect(requests[0]).toMatchObject({ method: 'post', url: '/api/v1/me/invites/i%2F1/accept' })
    expect(requests[1]).toMatchObject({ method: 'post', url: '/api/v1/me/invites/i1/decline' })
  })
})
