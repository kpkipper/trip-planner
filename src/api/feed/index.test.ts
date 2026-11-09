import { afterEach, describe, expect, it } from 'vitest'

import { apiClient } from '@/api/httpClient/apiClient'
import { fakeAdapter } from '@/api/test-adapter'

import { getFeed, getNowTravelers } from '.'

const original = apiClient.defaults.adapter
afterEach(() => {
  apiClient.defaults.adapter = original
})

const use = (data: unknown) => {
  const fake = fakeAdapter({ code: 'JOURNEY-200000', message: 'Success', data })
  apiClient.defaults.adapter = fake.adapter
  return fake.requests
}

describe('feed api', () => {
  it('getFeed with no args sends no params', async () => {
    const requests = use({ items: [{ id: 'f1' }], next_before: 'c' })
    await expect(getFeed()).resolves.toEqual({ items: [{ id: 'f1' }], next_before: 'c' })
    expect(requests[0]).toMatchObject({ method: 'get', url: '/api/v1/feed' })
  })

  it('getFeed passes before and limit', async () => {
    const seen: unknown[] = []
    apiClient.defaults.adapter = async (config) => {
      seen.push(config.params)
      return {
        data: { data: { items: [], next_before: null } },
        status: 200,
        statusText: '',
        headers: {},
        config,
      }
    }
    await expect(getFeed('cur', 10)).resolves.toEqual({ items: [], next_before: null })
    expect(seen[0]).toEqual({ before: 'cur', limit: 10 })
  })

  it('getNowTravelers unwraps travelers', async () => {
    const requests = use({ travelers: [{ day_number: 1 }] })
    await expect(getNowTravelers()).resolves.toEqual([{ day_number: 1 }])
    expect(requests[0].url).toBe('/api/v1/feed/now')
  })
})
