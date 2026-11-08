import { describe, expect, it } from 'vitest'

import { safeHttpsUrl } from './safe-url'

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
