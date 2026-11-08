import { afterEach, describe, expect, it } from 'vitest'

import { apiClient } from '@/api/httpClient/apiClient'
import { fakeAdapter } from '@/api/test-adapter'

import { loginWithGoogle, logout, startEmailLogin, verifyEmailLogin } from '.'

const original = apiClient.defaults.adapter
afterEach(() => {
  apiClient.defaults.adapter = original
})

const user = { id: 'u1', username: 'alice', email: 'a@example.com' }
const loginBody = { code: 'JOURNEY-200000', message: 'Success', data: { token: 't0k', user } }

describe('auth api', () => {
  it('loginWithGoogle posts the id token and returns {token, user}', async () => {
    const fake = fakeAdapter(loginBody)
    apiClient.defaults.adapter = fake.adapter
    await expect(loginWithGoogle('google-id-token')).resolves.toEqual({ token: 't0k', user })
    expect(fake.requests[0]).toMatchObject({
      method: 'post',
      url: '/api/v1/auth/google',
      data: { id_token: 'google-id-token' },
    })
  })

  it('startEmailLogin posts the email', async () => {
    const fake = fakeAdapter({ code: 'JOURNEY-200000', message: 'Success', data: {} })
    apiClient.defaults.adapter = fake.adapter
    await startEmailLogin('a@example.com')
    expect(fake.requests[0]).toMatchObject({
      method: 'post',
      url: '/api/v1/auth/email/start',
      data: { email: 'a@example.com' },
    })
  })

  it('startEmailLogin rejects with the HTTP status on 429', async () => {
    const fake = fakeAdapter({ code: 'JOURNEY-429000', message: 'too many requests' }, 429)
    apiClient.defaults.adapter = fake.adapter
    await expect(startEmailLogin('a@example.com')).rejects.toMatchObject({
      response: { status: 429 },
    })
  })

  it('verifyEmailLogin posts the token and returns {token, user}', async () => {
    const fake = fakeAdapter(loginBody)
    apiClient.defaults.adapter = fake.adapter
    await expect(verifyEmailLogin('mail-token')).resolves.toEqual({ token: 't0k', user })
    expect(fake.requests[0]).toMatchObject({
      method: 'post',
      url: '/api/v1/auth/email/verify',
      data: { token: 'mail-token' },
    })
  })

  it('logout sends the given session token explicitly', async () => {
    const fake = fakeAdapter({ code: 'JOURNEY-200000', message: 'Success', data: {} })
    apiClient.defaults.adapter = fake.adapter
    await logout('old-session')
    expect(fake.requests[0]).toMatchObject({ method: 'post', url: '/api/v1/auth/logout' })
    expect(fake.requests[0].headers.Authorization).toBe('Bearer old-session')
  })
})
