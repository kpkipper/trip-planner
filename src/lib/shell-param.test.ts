import { describe, expect, it } from 'vitest'

import { slugFromPath } from './shell-param'

describe('slugFromPath', () => {
  it('reads the segment after the prefix', () => {
    expect(slugFromPath('/plans/abc', '/plans')).toBe('abc')
    expect(slugFromPath('/u/kipper', '/u')).toBe('kipper')
    expect(slugFromPath('/join/tok123', '/join')).toBe('tok123')
  })

  it('ignores sub-paths such as /edit', () => {
    expect(slugFromPath('/plans/abc/edit', '/plans')).toBe('abc')
  })

  it('handles trailing slash and .html', () => {
    expect(slugFromPath('/plans/abc/', '/plans')).toBe('abc')
    expect(slugFromPath('/plans/abc.html', '/plans')).toBe('abc')
    expect(slugFromPath('/plans/abc/edit.html', '/plans')).toBe('abc')
    expect(slugFromPath('/plans/abc/edit/', '/plans')).toBe('abc')
  })

  it('decodes percent-encoding and tolerates malformed input', () => {
    expect(slugFromPath('/plans/my%20trip', '/plans')).toBe('my trip')
    expect(slugFromPath('/plans/%E0%A4%A', '/plans')).toBe('%E0%A4%A')
  })

  it('returns null for the shell placeholder itself', () => {
    expect(slugFromPath('/plans/_shell', '/plans')).toBeNull()
    expect(slugFromPath('/plans/_shell/edit', '/plans')).toBeNull()
    expect(slugFromPath('/plans/_shell.html', '/plans')).toBeNull()
  })

  it('returns null when the prefix does not match or no segment', () => {
    expect(slugFromPath('/other/abc', '/plans')).toBeNull()
    expect(slugFromPath('/plans', '/plans')).toBeNull()
    expect(slugFromPath('/plans/', '/plans')).toBeNull()
    expect(slugFromPath('/plansabc/x', '/plans')).toBeNull()
    expect(slugFromPath('', '/plans')).toBeNull()
  })
})
