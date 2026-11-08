import { describe, expect, it } from 'vitest'

import { consumeVerifyToken } from './verify-token'

describe('consumeVerifyToken', () => {
  it('returns the token and a URL without it', () => {
    expect(consumeVerifyToken('https://jourlyplan.web.app/auth/verify?token=abc123')).toEqual({
      token: 'abc123',
      cleanUrl: '/auth/verify',
    })
  })

  it('keeps other query params and the hash', () => {
    expect(
      consumeVerifyToken('https://jourlyplan.web.app/auth/verify?next=%2Fplans&token=abc#x'),
    ).toEqual({ token: 'abc', cleanUrl: '/auth/verify?next=%2Fplans#x' })
  })

  it('removes every token param, including duplicates', () => {
    const { token, cleanUrl } = consumeVerifyToken(
      'http://localhost:3000/auth/verify?token=a&token=b',
    )
    expect(token).toBe('a')
    expect(cleanUrl).toBe('/auth/verify')
  })

  it('returns null when there is no token or it is empty', () => {
    expect(consumeVerifyToken('https://jourlyplan.web.app/auth/verify')).toEqual({
      token: null,
      cleanUrl: '/auth/verify',
    })
    expect(consumeVerifyToken('https://jourlyplan.web.app/auth/verify?token=')).toEqual({
      token: null,
      cleanUrl: '/auth/verify',
    })
  })

  it('never returns a cross-origin URL and survives garbage input', () => {
    expect(consumeVerifyToken('not a url')).toEqual({ token: null, cleanUrl: '/auth/verify' })
    expect(consumeVerifyToken('https://jourlyplan.web.app//evil.com/?token=a').cleanUrl).toBe(
      '/auth/verify',
    )
  })
})
