import { describe, expect, it } from 'vitest'

import { emailStartErrorMessage, loginErrorMessage, verifyErrorMessage } from './errors'

const httpError = (status: number) => ({ isAxiosError: true, response: { status } })

describe('emailStartErrorMessage', () => {
  it('maps 429 to a rate-limit message', () => {
    expect(emailStartErrorMessage(httpError(429))).toMatch(/too many/i)
  })

  it('maps 400 to an invalid email message', () => {
    expect(emailStartErrorMessage(httpError(400))).toMatch(/valid email/i)
  })

  it('maps 403 to "email login is turned off"', () => {
    expect(emailStartErrorMessage(httpError(403))).toMatch(/email login is turned off/i)
  })

  it('falls back to a generic message', () => {
    expect(emailStartErrorMessage(httpError(500))).toMatch(/something went wrong/i)
    expect(emailStartErrorMessage(new Error('Network Error'))).toMatch(/something went wrong/i)
  })
})

describe('verifyErrorMessage', () => {
  it('maps 400 (and a missing token) to invalid/expired', () => {
    expect(verifyErrorMessage(httpError(400))).toMatch(/invalid or has expired/i)
    expect(verifyErrorMessage(null)).toMatch(/invalid or has expired/i)
  })

  it('maps 403 to "email login is turned off"', () => {
    expect(verifyErrorMessage(httpError(403))).toMatch(/email login is turned off/i)
  })

  it('falls back to a generic message', () => {
    expect(verifyErrorMessage(httpError(500))).toMatch(/something went wrong/i)
  })
})

describe('loginErrorMessage', () => {
  it('maps 400/401 to a failed Google sign-in and others to generic', () => {
    expect(loginErrorMessage(httpError(400))).toMatch(/google sign-in failed/i)
    expect(loginErrorMessage(httpError(401))).toMatch(/google sign-in failed/i)
    expect(loginErrorMessage(httpError(503))).toMatch(/something went wrong/i)
  })
})
