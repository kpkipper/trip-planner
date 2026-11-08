import { describe, expect, it } from 'vitest'

import { guessTimezone, timezoneOptions } from './timezone'

describe('guessTimezone', () => {
  it('maps known countries', () => {
    expect(guessTimezone('Japan')).toBe('Asia/Tokyo')
    expect(guessTimezone('South Korea')).toBe('Asia/Seoul')
    expect(guessTimezone('Korea')).toBe('Asia/Seoul')
    expect(guessTimezone('United Kingdom')).toBe('Europe/London')
    expect(guessTimezone('Hong Kong')).toBe('Asia/Hong_Kong')
  })
  it('ignores case and surrounding spaces', () => {
    expect(guessTimezone('  japan ')).toBe('Asia/Tokyo')
  })
  it('falls back to Asia/Bangkok', () => {
    expect(guessTimezone('Narnia')).toBe('Asia/Bangkok')
    expect(guessTimezone('')).toBe('Asia/Bangkok')
  })
})

describe('timezoneOptions', () => {
  it('lists the known zones without duplicates', () => {
    const options = timezoneOptions()
    expect(options).toContain('Asia/Tokyo')
    expect(new Set(options).size).toBe(options.length)
  })
  it('includes the current value when it is not in the list', () => {
    expect(timezoneOptions('Pacific/Auckland')).toContain('Pacific/Auckland')
    expect(timezoneOptions('Asia/Tokyo').filter((z) => z === 'Asia/Tokyo')).toHaveLength(1)
  })
})
