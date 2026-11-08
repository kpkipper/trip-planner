import { afterEach, describe, expect, it } from 'vitest'

import { apiClient } from '@/api/httpClient/apiClient'
import { fakeAdapter } from '@/api/test-adapter'

import {
  addDay,
  addPlan,
  deleteDay,
  deletePlan,
  patchJourney,
  reorderPlans,
  updateDay,
  updatePlan,
} from '.'

const original = apiClient.defaults.adapter
afterEach(() => {
  apiClient.defaults.adapter = original
})

const ok = (data: unknown = {}) => ({ code: 'JOURNEY-200000', message: 'Success', data })

const use = (body = ok()) => {
  const fake = fakeAdapter(body)
  apiClient.defaults.adapter = fake.adapter
  return fake
}

describe('itinerary api', () => {
  it('patches the journey', async () => {
    const fake = use()
    await patchJourney('a/b', { title: 'T' })
    expect(fake.requests[0]).toMatchObject({
      method: 'patch',
      url: '/api/v1/journeys/a%2Fb',
      data: { title: 'T' },
    })
  })

  it('adds a day and returns it', async () => {
    const fake = use(ok({ id: 'D1', date: 'x', date_iso: '2026-12-01T00:00:00Z', title: '' }))
    const day = await addDay('s', { date: 'x', date_iso: '2026-12-01T00:00:00Z', title: '' })
    expect(day.id).toBe('D1')
    expect(fake.requests[0]).toMatchObject({ method: 'post', url: '/api/v1/journeys/s/days' })
  })

  it('updates and deletes a day', async () => {
    const fake = use()
    await updateDay('s', 'd/1', { title: 'New' })
    await deleteDay('s', 'd1')
    expect(fake.requests[0]).toMatchObject({
      method: 'patch',
      url: '/api/v1/journeys/s/days/d%2F1',
      data: { title: 'New' },
    })
    expect(fake.requests[1]).toMatchObject({ method: 'delete', url: '/api/v1/journeys/s/days/d1' })
  })

  it('adds a plan to a day and returns it', async () => {
    const fake = use(ok({ id: 'P1', description: 'Lunch' }))
    const plan = await addPlan('s', 'd1', { description: 'Lunch', category: 'food' })
    expect(plan.id).toBe('P1')
    expect(fake.requests[0]).toMatchObject({
      method: 'post',
      url: '/api/v1/journeys/s/days/d1/plans',
      data: { description: 'Lunch', category: 'food' },
    })
  })

  it('updates, deletes and reorders plans', async () => {
    const fake = use()
    await updatePlan('s', 'p1', { time: '09:00', day_id: 'd2' })
    await deletePlan('s', 'p1')
    await reorderPlans('s', 'd1', ['p2', 'p1'])
    expect(fake.requests[0]).toMatchObject({
      method: 'patch',
      url: '/api/v1/journeys/s/plans/p1',
      data: { time: '09:00', day_id: 'd2' },
    })
    expect(fake.requests[1]).toMatchObject({ method: 'delete', url: '/api/v1/journeys/s/plans/p1' })
    expect(fake.requests[2]).toMatchObject({
      method: 'put',
      url: '/api/v1/journeys/s/days/d1/plans/order',
      data: { plan_ids: ['p2', 'p1'] },
    })
  })

  it('rejects on HTTP errors', async () => {
    apiClient.defaults.adapter = fakeAdapter({ message: 'nope' }, 403).adapter
    await expect(deletePlan('s', 'p1')).rejects.toThrow('403')
  })
})
