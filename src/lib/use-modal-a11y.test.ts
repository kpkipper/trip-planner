import { describe, expect, it } from 'vitest'

import { nextFocusIndex } from './use-modal-a11y'

describe('nextFocusIndex', () => {
  it('moves forward and wraps to the first', () => {
    expect(nextFocusIndex(0, 3, false)).toBe(1)
    expect(nextFocusIndex(2, 3, false)).toBe(0)
  })
  it('moves back and wraps to the last', () => {
    expect(nextFocusIndex(2, 3, true)).toBe(1)
    expect(nextFocusIndex(0, 3, true)).toBe(2)
  })
  it('enters the trap from outside', () => {
    expect(nextFocusIndex(-1, 3, false)).toBe(0)
    expect(nextFocusIndex(-1, 3, true)).toBe(2)
  })
  it('handles a single element and no elements', () => {
    expect(nextFocusIndex(0, 1, false)).toBe(0)
    expect(nextFocusIndex(0, 1, true)).toBe(0)
    expect(nextFocusIndex(-1, 0, false)).toBe(-1)
  })
})
