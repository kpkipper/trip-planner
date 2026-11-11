import { describe, expect, it } from 'vitest'

import { coverGradient } from './cover-gradient'

describe('coverGradient', () => {
  it('is stable for the same seed', () => {
    expect(coverGradient('osaka-1')).toBe(coverGradient('osaka-1'))
  })

  it('returns a CSS linear-gradient', () => {
    expect(coverGradient('osaka-1').startsWith('linear-gradient(')).toBe(true)
    expect(coverGradient('').startsWith('linear-gradient(')).toBe(true)
  })

  it('gives different seeds different gradients', () => {
    const seeds = ['osaka-1', 'kyoto-2', 'tokyo-3', 'nagoya-4', 'sapporo-5', 'fukuoka-6']
    expect(new Set(seeds.map(coverGradient)).size).toBeGreaterThan(1)
  })
})
