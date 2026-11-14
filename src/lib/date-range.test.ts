import { describe, expect, it } from 'vitest'

import {
  addDays,
  addMonthsClamped,
  cellState,
  dayCount,
  formatDateLong,
  formatDateShort,
  isOutOfRange,
  MAX_TRIP_DAYS,
  monthGrid,
  monthTitle,
  pickDate,
  rangeSummary,
  shiftMonth,
} from './date-range'

describe('addDays / dayCount', () => {
  it('moves across months and years', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
  })
  it('is not shifted by daylight saving', () => {
    expect(addDays('2026-03-07', 3)).toBe('2026-03-10')
    expect(addDays('2026-10-31', 3)).toBe('2026-11-03')
  })
  it('counts days inclusive', () => {
    expect(dayCount('2026-11-14', '2026-11-14')).toBe(1)
    expect(dayCount('2026-11-14', '2026-11-17')).toBe(4)
    expect(dayCount('2026-12-30', '2027-01-02')).toBe(4)
  })
})

describe('monthGrid', () => {
  it('starts on Sunday and pads to six weeks with nulls', () => {
    // 1 Nov 2026 is a Sunday; 30 days fill 5 weeks, the 6th is empty.
    const weeks = monthGrid(2026, 10)
    expect(weeks).toHaveLength(6)
    expect(weeks[0][0]).toBe('2026-11-01')
    expect(weeks[4][1]).toBe('2026-11-30')
    expect(weeks[4][2]).toBeNull()
    expect(weeks[5].every((c) => c === null)).toBe(true)
  })
  it('pads the first week', () => {
    // 1 Jan 2026 is a Thursday.
    const first = monthGrid(2026, 0)[0]
    expect(first.slice(0, 4)).toEqual([null, null, null, null])
    expect(first[4]).toBe('2026-01-01')
  })
  it('every week has 7 cells', () => {
    for (const w of monthGrid(2026, 1)) expect(w).toHaveLength(7)
  })
})

describe('addMonthsClamped', () => {
  it('keeps the day when it exists', () => {
    expect(addMonthsClamped('2026-11-14', 1)).toBe('2026-12-14')
    expect(addMonthsClamped('2026-01-15', -1)).toBe('2025-12-15')
  })
  it('clamps to the last day of a shorter month', () => {
    expect(addMonthsClamped('2026-03-31', 1)).toBe('2026-04-30')
    expect(addMonthsClamped('2026-03-31', -1)).toBe('2026-02-28')
    expect(addMonthsClamped('2028-03-30', -1)).toBe('2028-02-29')
  })
})

describe('shiftMonth / monthTitle', () => {
  it('wraps the year', () => {
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 })
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 })
  })
  it('names the month', () => {
    expect(monthTitle(2026, 10)).toBe('November 2026')
  })
})

describe('pickDate', () => {
  it('first pick sets the start', () => {
    expect(pickDate({ start: '', end: '' }, '2026-11-14')).toEqual({
      start: '2026-11-14',
      end: '',
      done: false,
    })
  })
  it('second pick on or after the start sets the end', () => {
    expect(pickDate({ start: '2026-11-14', end: '' }, '2026-11-17')).toEqual({
      start: '2026-11-14',
      end: '2026-11-17',
      done: true,
    })
  })
  it('picking the start again makes a one-day trip', () => {
    expect(pickDate({ start: '2026-11-14', end: '' }, '2026-11-14')).toEqual({
      start: '2026-11-14',
      end: '2026-11-14',
      done: true,
    })
  })
  it('a pick before the start becomes the new start', () => {
    expect(pickDate({ start: '2026-11-14', end: '' }, '2026-11-10')).toEqual({
      start: '2026-11-10',
      end: '',
      done: false,
    })
  })
  it('a pick after a complete range starts over', () => {
    expect(pickDate({ start: '2026-11-14', end: '2026-11-17' }, '2026-11-20')).toEqual({
      start: '2026-11-20',
      end: '',
      done: false,
    })
  })
  it(`an end more than ${MAX_TRIP_DAYS} days away starts over`, () => {
    const tooFar = addDays('2026-11-14', MAX_TRIP_DAYS)
    expect(pickDate({ start: '2026-11-14', end: '' }, tooFar)).toEqual({
      start: tooFar,
      end: '',
      done: false,
    })
    const last = addDays('2026-11-14', MAX_TRIP_DAYS - 1)
    expect(pickDate({ start: '2026-11-14', end: '' }, last).done).toBe(true)
  })
})

describe('isOutOfRange', () => {
  it('only limits the end while it is being picked', () => {
    const r = { start: '2026-11-14', end: '' }
    expect(isOutOfRange(addDays('2026-11-14', MAX_TRIP_DAYS - 1), r)).toBe(false)
    expect(isOutOfRange(addDays('2026-11-14', MAX_TRIP_DAYS), r)).toBe(true)
    expect(isOutOfRange('2026-11-01', r)).toBe(false)
    expect(isOutOfRange('2030-01-01', { start: '', end: '' })).toBe(false)
    expect(isOutOfRange('2030-01-01', { start: '2026-11-14', end: '2026-11-15' })).toBe(false)
  })
})

describe('cellState', () => {
  const r = { start: '2026-11-14', end: '2026-11-17' }
  it('marks start, end and the days between', () => {
    expect(cellState('2026-11-14', r)).toBe('start')
    expect(cellState('2026-11-15', r)).toBe('between')
    expect(cellState('2026-11-17', r)).toBe('end')
    expect(cellState('2026-11-18', r)).toBe('none')
    expect(cellState('2026-11-13', r)).toBe('none')
  })
  it('a one-day range is single', () => {
    expect(cellState('2026-11-14', { start: '2026-11-14', end: '2026-11-14' })).toBe('single')
  })
  it('previews the range up to the hovered day while picking the end', () => {
    const picking = { start: '2026-11-14', end: '' }
    expect(cellState('2026-11-14', picking, '2026-11-16')).toBe('start')
    expect(cellState('2026-11-15', picking, '2026-11-16')).toBe('between')
    expect(cellState('2026-11-16', picking, '2026-11-16')).toBe('end')
    expect(cellState('2026-11-14', picking)).toBe('single')
    // Hovering before the start previews nothing.
    expect(cellState('2026-11-13', picking, '2026-11-12')).toBe('none')
    expect(cellState('2026-11-14', picking, '2026-11-12')).toBe('single')
  })
})

describe('rangeSummary', () => {
  it('counts nights and days', () => {
    expect(rangeSummary('2026-11-14', '2026-11-17')).toBe('3 nights · 4 days')
    expect(rangeSummary('2026-11-14', '2026-11-15')).toBe('1 night · 2 days')
  })
  it('a one-day trip', () => {
    expect(rangeSummary('2026-11-14', '2026-11-14')).toBe('Day trip · 1 day')
  })
  it('nothing for an incomplete or reversed range', () => {
    expect(rangeSummary('2026-11-14', '')).toBe('')
    expect(rangeSummary('2026-11-17', '2026-11-14')).toBe('')
  })
})

describe('formatting', () => {
  it('short and long labels', () => {
    expect(formatDateShort('2026-11-14')).toBe('Sat, 14 Nov')
    expect(formatDateLong('2026-11-14')).toBe('Saturday, 14 November 2026')
  })
  it('empty input gives empty output', () => {
    expect(formatDateShort('')).toBe('')
  })
})
