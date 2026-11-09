import { afterEach, describe, expect, it } from 'vitest'

import { apiClient } from '@/api/httpClient/apiClient'
import { fakeAdapter } from '@/api/test-adapter'

import {
  completeUpload,
  deleteMoment,
  listMoments,
  listMyMoments,
  startUpload,
  updateCaption,
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

describe('moments api', () => {
  it('startUpload posts the body and returns {moment, upload}', async () => {
    const requests = use({ moment: { id: 'm1' }, upload: { url: 'u', method: 'PUT', headers: {} } })
    const input = { kind: 'photo' as const, content_type: 'image/jpeg', size_bytes: 5, day_id: 'd' }
    const res = await startUpload('a/b', input)
    expect(res.moment.id).toBe('m1')
    expect(requests[0]).toMatchObject({
      method: 'post',
      url: '/api/v1/journeys/a%2Fb/moments/uploads',
      data: input,
    })
  })

  it('completeUpload posts to complete', async () => {
    const requests = use({ id: 'm/1' })
    await expect(completeUpload('trip', 'm/1')).resolves.toEqual({ id: 'm/1' })
    expect(requests[0]).toMatchObject({
      method: 'post',
      url: '/api/v1/journeys/trip/moments/m%2F1/complete',
    })
  })

  it('listMoments unwraps moments, defaulting to []', async () => {
    let requests = use({ moments: [{ id: 'm1' }] })
    await expect(listMoments('trip')).resolves.toEqual([{ id: 'm1' }])
    expect(requests[0]).toMatchObject({ method: 'get', url: '/api/v1/journeys/trip/moments' })
    requests = use(null)
    await expect(listMoments('trip')).resolves.toEqual([])
  })

  it('updateCaption patches and deleteMoment deletes', async () => {
    let requests = use({ id: 'm1', caption: 'hi' })
    await expect(updateCaption('m 1', 'hi')).resolves.toMatchObject({ caption: 'hi' })
    expect(requests[0]).toMatchObject({
      method: 'patch',
      url: '/api/v1/moments/m%201',
      data: { caption: 'hi' },
    })
    requests = use(null, 204)
    await deleteMoment('m1')
    expect(requests[0]).toMatchObject({ method: 'delete', url: '/api/v1/moments/m1' })
  })

  it('listMyMoments gets /me/moments', async () => {
    const requests = use({ moments: [{ id: 'm1' }] })
    await expect(listMyMoments()).resolves.toEqual([{ id: 'm1' }])
    expect(requests[0]).toMatchObject({ method: 'get', url: '/api/v1/me/moments' })
  })
})
