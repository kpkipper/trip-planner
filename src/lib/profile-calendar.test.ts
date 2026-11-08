import { describe, expect, it } from 'vitest'

import { groupCalendar } from './profile-calendar'

const item = (slug: string, departure?: string, extra = {}) => ({
  slug,
  title: slug,
  destination: 'X',
  country: 'Y',
  departure_date: departure,
  ...extra,
})

describe('groupCalendar', () => {
  it('groups dated items by year then month, ascending', () => {
    const { years, hidden } = groupCalendar([
      item('c', '2027-01-05T00:00:00Z'),
      item('a', '2026-12-20T00:00:00Z'),
      item('b', '2026-12-02T00:00:00Z'),
    ])
    expect(hidden).toEqual([])
    expect(years.map((y) => y.year)).toEqual([2026, 2027])
    expect(years[0].months).toHaveLength(1)
    expect(years[0].months[0].month).toBe(12)
    expect(years[0].months[0].items.map((i) => i.slug)).toEqual(['b', 'a'])
    expect(years[1].months[0].month).toBe(1)
  })
  it('puts items without dates in hidden and never infers a date', () => {
    const { years, hidden } = groupCalendar([
      item('x', undefined, { month_start: '2026-08', month_end: '2026-09' }),
      item('y', ''),
      item('z', '2026-08-01T00:00:00Z'),
    ])
    expect(hidden.map((i) => i.slug)).toEqual(['x', 'y'])
    expect(years).toHaveLength(1)
    expect(years[0].months[0].items.map((i) => i.slug)).toEqual(['z'])
  })
  it('treats an unparseable date as hidden', () => {
    expect(groupCalendar([item('q', 'soon')]).hidden).toHaveLength(1)
  })
  it('handles empty and null input', () => {
    expect(groupCalendar([])).toEqual({ years: [], hidden: [] })
    expect(groupCalendar(null)).toEqual({ years: [], hidden: [] })
  })
})
