import { afterEach, describe, expect, it } from 'vitest'

import { generateDays } from './days'
import { planSync } from './sync'

import type { Trip, TripDay } from '@/types/trip'

const originalTZ = process.env.TZ
afterEach(() => {
  process.env.TZ = originalTZ
})

const day = (id: string, dateISO: string, planIds: string[] = []): TripDay => ({
  id,
  date: dateISO,
  dateISO,
  title: id,
  activities: planIds.map((p) => ({ id: p, time: '', description: p })),
})

describe('generateDays', () => {
  it('builds calendar dates without a UTC shift (UTC+13)', () => {
    process.env.TZ = 'Pacific/Auckland'
    const days = generateDays('2026-12-30', '2027-01-02', [])
    expect(days.map((d) => d.dateISO)).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ])
  })

  it('builds calendar dates without a UTC shift (UTC-10)', () => {
    process.env.TZ = 'Pacific/Honolulu'
    expect(generateDays('2026-03-07', '2026-03-09', []).map((d) => d.dateISO)).toEqual([
      '2026-03-07',
      '2026-03-08',
      '2026-03-09',
    ])
  })

  it('keeps existing days by date and their ids', () => {
    const d1 = day('d1', '2026-12-01', ['p1'])
    const out = generateDays('2026-12-01', '2026-12-02', [d1])
    expect(out[0]).toBe(d1)
    expect(out[1].dateISO).toBe('2026-12-02')
    expect(out[1].id).not.toBe('d1')
  })

  it('keeps every existing day that shares a date, once each', () => {
    const a = day('a', '2026-12-01', ['p1'])
    const b = day('b', '2026-12-01', ['p2'])
    const out = generateDays('2026-11-30', '2026-12-01', [a, b, a])
    expect(out.map((d) => d.id).slice(1)).toEqual(['a', 'b'])
    expect(out[0].dateISO).toBe('2026-11-30')
  })

  it('two server days with the same date survive a range change: no deletes', () => {
    const original: Trip = {
      title: 'T',
      destination: 'D',
      country: 'C',
      startDate: '2026-12-01',
      endDate: '2026-12-02',
      days: [
        day('a', '2026-12-01', ['p1']),
        day('b', '2026-12-01', ['p2']),
        day('c', '2026-12-02'),
      ],
    }
    const days = generateDays('2026-12-01', '2026-12-03', original.days)
    const ops = planSync(original, { ...original, endDate: '2026-12-03', days })
    expect(ops.map((o) => o.type)).toEqual(['patchTrip', 'addDay'])
  })
})
