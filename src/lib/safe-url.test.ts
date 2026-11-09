import { describe, expect, it } from 'vitest'
import { afterEach, vi } from 'vitest'

import { safeHttpsUrl, safeHttpUrl, safeMediaUrl } from './safe-url'

describe('safeHttpsUrl', () => {
  it('accepts https URLs', () => {
    expect(safeHttpsUrl('https://lh3.googleusercontent.com/a/x=s96')).toBe(
      'https://lh3.googleusercontent.com/a/x=s96',
    )
  })

  it('rejects non-https and malformed values', () => {
    expect(safeHttpsUrl('http://example.com/a.png')).toBeNull()
    expect(safeHttpsUrl('javascript:alert(1)')).toBeNull()
    expect(safeHttpsUrl('data:image/png;base64,AAAA')).toBeNull()
    expect(safeHttpsUrl('/relative.png')).toBeNull()
    expect(safeHttpsUrl('not a url')).toBeNull()
    expect(safeHttpsUrl('')).toBeNull()
    expect(safeHttpsUrl(null)).toBeNull()
    expect(safeHttpsUrl(undefined)).toBeNull()
  })
})

describe('safeHttpUrl', () => {
  it('accepts http and https', () => {
    expect(safeHttpUrl('https://maps.google.com/?q=a')).toBe('https://maps.google.com/?q=a')
    expect(safeHttpUrl('http://example.com')).toBe('http://example.com')
  })

  it('rejects other schemes and malformed values', () => {
    expect(safeHttpUrl('javascript:alert(1)')).toBeUndefined()
    expect(safeHttpUrl(' JavaScript:alert(1)')).toBeUndefined()
    expect(safeHttpUrl('data:text/html,x')).toBeUndefined()
    expect(safeHttpUrl('/relative')).toBeUndefined()
    expect(safeHttpUrl('')).toBeUndefined()
    expect(safeHttpUrl(null)).toBeUndefined()
  })
})

describe('safeMediaUrl', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('accepts https always', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(safeMediaUrl('https://storage.googleapis.com/b/o?sig=1')).toBe(
      'https://storage.googleapis.com/b/o?sig=1',
    )
  })

  it('accepts http only for localhost / 127.0.0.1 outside production', () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(safeMediaUrl('http://localhost:8080/api/v1/media/local/a.jpg')).toBe(
      'http://localhost:8080/api/v1/media/local/a.jpg',
    )
    expect(safeMediaUrl('http://127.0.0.1:8080/a.jpg')).toBe('http://127.0.0.1:8080/a.jpg')
    expect(safeMediaUrl('http://example.com/a.jpg')).toBeNull()
    expect(safeMediaUrl('http://localhost.evil.com/a.jpg')).toBeNull()
  })

  it('rejects http localhost in production', () => {
    vi.stubEnv('NODE_ENV', 'production')
    expect(safeMediaUrl('http://localhost:8080/a.jpg')).toBeNull()
    expect(safeMediaUrl('http://127.0.0.1/a.jpg')).toBeNull()
  })

  it('rejects other schemes and bad values', () => {
    vi.stubEnv('NODE_ENV', 'development')
    for (const v of [
      'javascript:alert(1)',
      'data:image/png;base64,AA',
      '/rel.png',
      '',
      null,
      undefined,
    ])
      expect(safeMediaUrl(v)).toBeNull()
  })
})
