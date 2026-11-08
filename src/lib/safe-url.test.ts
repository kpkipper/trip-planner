import { describe, expect, it } from 'vitest'

import { safeHttpsUrl, safeHttpUrl } from './safe-url'

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
