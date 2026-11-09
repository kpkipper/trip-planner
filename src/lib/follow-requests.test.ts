import { describe, expect, it } from 'vitest'

import { badgeLabel, isGone, removeEntry } from './follow-requests'

const entry = (username: string) => ({
  user: { username } as never,
  created_at: 't',
})

describe('badgeLabel', () => {
  it('hides the badge for zero or invalid counts', () => {
    expect(badgeLabel(0)).toBe('')
    expect(badgeLabel(-1)).toBe('')
    expect(badgeLabel(NaN)).toBe('')
  })
  it('shows the count up to 99', () => {
    expect(badgeLabel(1)).toBe('1')
    expect(badgeLabel(99)).toBe('99')
  })
  it('caps at 99+', () => {
    expect(badgeLabel(100)).toBe('99+')
  })
})

describe('removeEntry', () => {
  it('drops the matching username only', () => {
    const list = [entry('a'), entry('b')]
    expect(removeEntry(list, 'a').map((e) => e.user.username)).toEqual(['b'])
    expect(removeEntry(list, 'zzz')).toHaveLength(2)
  })
})

describe('isGone', () => {
  it('is true only for a 404 response', () => {
    expect(isGone({ response: { status: 404 } })).toBe(true)
    expect(isGone({ response: { status: 500 } })).toBe(false)
    expect(isGone(new Error('x'))).toBe(false)
    expect(isGone(null)).toBe(false)
  })
})
