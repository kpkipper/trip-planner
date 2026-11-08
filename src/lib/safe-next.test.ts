import { describe, expect, it } from 'vitest'

import { loginPath, safeNext } from './safe-next'

describe('safeNext', () => {
  it('accepts same-origin relative paths', () => {
    expect(safeNext('/plans/tokyo')).toBe('/plans/tokyo')
    expect(safeNext('/plans/create?x=1#top')).toBe('/plans/create?x=1#top')
    expect(safeNext('/')).toBe('/')
  })

  it('falls back to / for empty or missing values', () => {
    expect(safeNext(null)).toBe('/')
    expect(safeNext(undefined)).toBe('/')
    expect(safeNext('')).toBe('/')
  })

  it('rejects absolute and protocol-relative URLs (open redirect)', () => {
    expect(safeNext('https://evil.com')).toBe('/')
    expect(safeNext('//evil.com')).toBe('/')
    expect(safeNext('//evil.com/plans')).toBe('/')
    expect(safeNext('javascript:alert(1)')).toBe('/')
    expect(safeNext('evil.com')).toBe('/')
    expect(safeNext('plans/tokyo')).toBe('/')
  })

  it('rejects backslash and control-character tricks browsers normalise to //', () => {
    expect(safeNext('/\\evil.com')).toBe('/')
    expect(safeNext('\\\\evil.com')).toBe('/')
    expect(safeNext('/\t/evil.com')).toBe('/')
    expect(safeNext('/\n/evil.com')).toBe('/')
    expect(safeNext(' //evil.com')).toBe('/')
  })

  it('rejects dot-segments that normalise into a protocol-relative URL', () => {
    expect(safeNext('/..//evil.com')).toBe('/')
    expect(safeNext('/.//evil.com/x')).toBe('/')
    expect(safeNext('/%2e%2e//evil.com')).toBe('/')
    expect(safeNext('/a/..//evil.com')).toBe('/')
    expect(safeNext('/\\evil.com')).toBe('/')
    expect(loginPath('/..//evil.com')).toBe('/login')
  })

  it('does not send the user back to the auth pages', () => {
    expect(safeNext('/login')).toBe('/')
    expect(safeNext('/login?next=/plans')).toBe('/')
    expect(safeNext('/auth/verify?token=abc')).toBe('/')
    expect(safeNext('/auth/verify/')).toBe('/')
  })

  it('uses a custom fallback', () => {
    expect(safeNext('//evil.com', '/plans/create')).toBe('/plans/create')
  })
})

describe('loginPath', () => {
  it('encodes the next path', () => {
    expect(loginPath('/plans/create')).toBe('/login?next=%2Fplans%2Fcreate')
    expect(loginPath('/plans/a?b=1&c=2')).toBe('/login?next=%2Fplans%2Fa%3Fb%3D1%26c%3D2')
  })

  it('omits next when it is unsafe or the home page', () => {
    expect(loginPath('/')).toBe('/login')
    expect(loginPath('//evil.com')).toBe('/login')
    expect(loginPath('/login')).toBe('/login')
    expect(loginPath()).toBe('/login')
  })
})
