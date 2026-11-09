import { afterEach, describe, expect, it } from 'vitest'

import { apiClient } from '@/api/httpClient/apiClient'
import { fakeAdapter } from '@/api/test-adapter'

import { blockUser, createReport, listBlocks, unblockUser } from '.'

const original = apiClient.defaults.adapter
afterEach(() => {
  apiClient.defaults.adapter = original
})

const use = (data: unknown, status = 200) => {
  const fake = fakeAdapter({ code: 'JOURNEY-200000', message: 'Success', data }, status)
  apiClient.defaults.adapter = fake.adapter
  return fake.requests
}

describe('safety api', () => {
  it('block and unblock encode the username', async () => {
    const requests = use(null, 204)
    await blockUser('a b')
    await unblockUser('a b')
    expect(requests[0]).toMatchObject({ method: 'post', url: '/api/v1/users/a%20b/block' })
    expect(requests[1]).toMatchObject({ method: 'delete', url: '/api/v1/users/a%20b/block' })
  })

  it('listBlocks unwraps users', async () => {
    const requests = use({ users: [{ username: 'x' }] })
    await expect(listBlocks()).resolves.toEqual([{ username: 'x' }])
    expect(requests[0].url).toBe('/api/v1/me/blocks')
  })

  it('createReport reports created=true on 201 and false on 200', async () => {
    const input = { target_type: 'user' as const, target: 'bob', reason: 'spam' as const }
    let requests = use({ id: 'r1' }, 201)
    await expect(createReport(input)).resolves.toEqual({ report: { id: 'r1' }, created: true })
    expect(requests[0]).toMatchObject({ method: 'post', url: '/api/v1/reports', data: input })
    requests = use({ id: 'r1' }, 200)
    await expect(createReport(input)).resolves.toMatchObject({ created: false })
  })
})
