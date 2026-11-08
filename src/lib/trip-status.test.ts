import { describe, expect, it } from 'vitest'

import { liveLabel, statusLabel } from './trip-status'

const base = { days_until: 0, day_number: 0, total_days: 0 }

describe('statusLabel', () => {
  it('labels planning', () => {
    expect(statusLabel({ ...base, state: 'planning' })).toEqual({
      emoji: '📝',
      text: 'Planning',
      tone: 'planning',
    })
  })

  it('labels upcoming with days until', () => {
    expect(statusLabel({ ...base, state: 'upcoming', days_until: 12 })?.text).toBe('In 12 days')
    expect(statusLabel({ ...base, state: 'upcoming', days_until: 1 })?.text).toBe('In 1 day')
  })

  it('uses a plain label when days_until is 0', () => {
    expect(statusLabel({ ...base, state: 'upcoming', days_until: 0 })?.text).toBe('Upcoming')
  })

  it('labels ongoing and completed', () => {
    expect(statusLabel({ state: 'ongoing', days_until: 0, day_number: 2, total_days: 5 })).toEqual({
      emoji: '🟢',
      text: 'Day 2 of 5',
      tone: 'ongoing',
    })
    expect(statusLabel({ ...base, state: 'completed', total_days: 4 })?.text).toBe('Completed')
  })

  it('returns null for a missing or unknown status', () => {
    expect(statusLabel(undefined)).toBeNull()
    expect(statusLabel({ ...base, state: 'weird' as never })).toBeNull()
  })
})

describe('liveLabel', () => {
  it('says where the trip is now', () => {
    expect(liveLabel({ city: 'Kyoto', dayNumber: 3, totalDays: 7 })).toBe(
      'Now in Kyoto · Day 3 of 7',
    )
  })
})
