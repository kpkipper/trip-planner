import { afterEach, describe, expect, it } from 'vitest'

import { apiClient } from '@/api/httpClient/apiClient'
import { fakeAdapter } from '@/api/test-adapter'

import { getJourneyBySlug, getMyJourneys, leaveJourney } from '.'

const original = apiClient.defaults.adapter
afterEach(() => {
  apiClient.defaults.adapter = original
})

const ok = { code: 'JOURNEY-200000', message: 'Success', data: [] }

describe('journey api', () => {
  it('encodes the slug path segment', async () => {
    const fake = fakeAdapter(ok)
    apiClient.defaults.adapter = fake.adapter
    await getJourneyBySlug('a/b?c')
    expect(fake.requests[0].url).toBe('/api/v1/journeys/a%2Fb%3Fc')
  })

  it('leaves a journey with POST', async () => {
    const fake = fakeAdapter(ok)
    apiClient.defaults.adapter = fake.adapter
    await leaveJourney('kyoto-1')
    expect(fake.requests[0]).toMatchObject({
      method: 'post',
      url: '/api/v1/journeys/kyoto-1/leave',
    })
  })

  it('loads my journeys', async () => {
    const fake = fakeAdapter({ ...ok, data: [{ slug: 's', role: 'owner' }] })
    apiClient.defaults.adapter = fake.adapter
    await expect(getMyJourneys()).resolves.toEqual([{ slug: 's', role: 'owner' }])
    expect(fake.requests[0]).toMatchObject({ method: 'get', url: '/api/v1/me/journeys' })
  })
})
