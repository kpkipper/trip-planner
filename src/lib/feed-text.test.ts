import { describe, expect, it } from 'vitest'

import { feedText, formatThaiDateRange, relativeThai } from './feed-text'

import type { FeedItem } from '@/api/feed/type'

const person = (username: string, display_name = '') => ({
  username,
  display_name,
  avatar_url: '',
  bio: '',
})

const base = (over: Partial<FeedItem> = {}): FeedItem => ({
  id: 'f1',
  type: 'trip_planned',
  at: '2026-11-09T00:00:00Z',
  actor: person('ann', 'Ann'),
  trip: {
    slug: 'tokyo 1',
    title: 'T',
    destination: 'Tokyo',
    country: 'JP',
    cover_url: '',
    departure_date: '2026-12-12T00:00:00Z',
    return_date: '2026-12-16T00:00:00Z',
  },
  companions: [],
  ...over,
})

const text = (item: FeedItem) =>
  feedText(item)
    .parts.map((p) => p.text)
    .join('')

describe('formatThaiDateRange', () => {
  it('same month', () => {
    expect(formatThaiDateRange('2026-12-12T00:00:00Z', '2026-12-16T00:00:00Z')).toBe('12–16 ธ.ค.')
  })
  it('same day', () => {
    expect(formatThaiDateRange('2026-12-12T00:00:00Z', '2026-12-12T00:00:00Z')).toBe('12 ธ.ค.')
  })
  it('across months', () => {
    expect(formatThaiDateRange('2026-11-30T00:00:00Z', '2026-12-02T00:00:00Z')).toBe(
      '30 พ.ย. – 2 ธ.ค.',
    )
  })
  it('across years adds the year', () => {
    expect(formatThaiDateRange('2026-12-30T00:00:00Z', '2027-01-02T00:00:00Z')).toBe(
      '30 ธ.ค. 2026 – 2 ม.ค. 2027',
    )
  })
  it('missing or invalid dates give empty', () => {
    expect(formatThaiDateRange(undefined, '2026-12-16T00:00:00Z')).toBe('')
    expect(formatThaiDateRange('x', 'y')).toBe('')
  })
  it('only departure', () => {
    expect(formatThaiDateRange('2026-12-12T00:00:00Z', undefined)).toBe('12 ธ.ค.')
  })
})

describe('feedText', () => {
  it('trip_planned with companions and dates', () => {
    const parts = feedText(base({ companions: [person('b', 'B'), person('c')] })).parts
    expect(parts.map((p) => p.text).join('')).toBe('Ann กำลังจะไป Tokyo กับ B, c · 12–16 ธ.ค.')
    expect(parts[0]).toMatchObject({ strong: true, href: '/u/ann' })
    expect(parts.find((p) => p.text === 'Tokyo')).toMatchObject({
      strong: true,
      href: '/plans/tokyo%201',
    })
  })
  it('trip_planned without companions or dates', () => {
    const item = base()
    item.trip.departure_date = undefined
    item.trip.return_date = undefined
    expect(text(item)).toBe('Ann กำลังจะไป Tokyo')
  })
  it('trip_planned with 5 companions shows 3 and "อีก 2 คน"', () => {
    const cs = ['a', 'b', 'c', 'd', 'e'].map((u) => person(u, u.toUpperCase()))
    expect(text(base({ companions: cs }))).toBe(
      'Ann กำลังจะไป Tokyo กับ A, B, C และอีก 2 คน · 12–16 ธ.ค.',
    )
  })
  it('actor falls back to username', () => {
    expect(text(base({ actor: person('zed') }))).toContain('zed กำลังจะไป')
  })
  it('trip_started', () => {
    expect(text(base({ type: 'trip_started' }))).toBe('Ann เริ่มทริป Tokyo แล้ว 🟢')
  })
  it('moments_added', () => {
    expect(
      text(
        base({
          type: 'moments_added',
          moments: { count: 3, day_id: 'd', day_title: 'วันที่ 2', thumbs: [] },
        }),
      ),
    ).toBe('Ann แปะ 3 รูปใน วันที่ 2')
  })
  it('trip_completed', () => {
    expect(text(base({ type: 'trip_completed' }))).toBe('Ann เที่ยว Tokyo จบแล้ว ✅')
  })
})

describe('relativeThai', () => {
  const now = new Date('2026-11-09T12:00:00Z')
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()
  it('buckets', () => {
    expect(relativeThai(ago(30_000), now)).toBe('เมื่อสักครู่')
    expect(relativeThai(ago(5 * 60_000), now)).toBe('5 นาทีที่แล้ว')
    expect(relativeThai(ago(3 * 3_600_000), now)).toBe('3 ชม.ที่แล้ว')
    expect(relativeThai(ago(2 * 86_400_000), now)).toBe('2 วันที่แล้ว')
  })
  it('future timestamps are just now', () => {
    expect(relativeThai(ago(-60_000), now)).toBe('เมื่อสักครู่')
  })
  it('older than 7 days gives a date', () => {
    expect(relativeThai(ago(10 * 86_400_000), now)).toBe('30 ต.ค.')
    expect(relativeThai('2025-03-01T00:00:00Z', now)).toBe('1 มี.ค. 2025')
  })
  it('invalid gives empty', () => {
    expect(relativeThai('nope', now)).toBe('')
  })
})
