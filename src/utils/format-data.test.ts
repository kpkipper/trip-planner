import { describe, expect, it } from 'vitest'

import { toTrip, toTripList, toTripListFromMine } from './format-data'

import type { JourneyView } from '@/api/journey/type'

const status = { state: 'ongoing' as const, days_until: 0, day_number: 2, total_days: 3 }

const full: JourneyView = {
  id: 'j1',
  slug: 'kyoto-1',
  title: 'Kyoto',
  destination: 'Kyoto, Japan',
  country: 'Japan',
  cover_url: 'https://img.example.com/c.jpg',
  visibility: 'followers',
  owner: { username: 'alice', display_name: 'Alice', avatar_url: '', bio: 'hi' },
  status,
  month_start: '2026-12',
  month_end: '2026-12',
  departure_date: '2026-12-01T00:00:00Z',
  return_date: '2026-12-03T00:00:00Z',
  itinerary_days: [
    {
      id: 'd1',
      date: 'Mon 1 Dec',
      date_iso: '2026-12-01T00:00:00Z',
      title: 'Arrive',
      plans: [
        {
          id: 'p1',
          day_id: 'd1',
          time: '10:00',
          description: 'Hotel',
          category: 'stay',
          position: 1,
          hidden_from_public: true,
        },
        { id: 'p2', day_id: 'd1', time: '12:00', description: 'Lunch', map_url: 'https://m' },
      ],
    },
  ],
  members: [
    { username: 'alice', display_name: 'Alice', avatar_url: '', role: 'owner', status: 'joined' },
    { username: 'bob', display_name: 'Bob', avatar_url: '', role: 'traveler', status: 'joined' },
  ],
  redacted: false,
  role: 'editor',
  live: { city: 'Kyoto', day_number: 2, total_days: 3, today_plans: [] },
  updated_at: '2026-12-02T00:00:00Z',
}

describe('toTrip', () => {
  it('maps a full view and keeps server ids', () => {
    const t = toTrip(full)
    expect(t).toMatchObject({
      id: 'j1',
      slug: 'kyoto-1',
      destination: 'Kyoto',
      country: 'Japan',
      startDate: '2026-12-01',
      endDate: '2026-12-03',
      redacted: false,
      role: 'editor',
      visibility: 'followers',
      coverUrl: 'https://img.example.com/c.jpg',
      status,
      monthStart: '2026-12',
      owner: { username: 'alice', displayName: 'Alice' },
      live: { city: 'Kyoto', dayNumber: 2, totalDays: 3, todayPlans: [] },
    })
    expect(t.members?.map((m) => [m.username, m.role])).toEqual([
      ['alice', 'owner'],
      ['bob', 'traveler'],
    ])
    expect(t.days).toHaveLength(1)
    expect(t.days[0]).toMatchObject({ id: 'd1', dateISO: '2026-12-01' })
    expect(t.days[0].activities[0]).toMatchObject({
      id: 'p1',
      category: 'stay',
      hiddenFromPublic: true,
    })
    expect(t.days[0].activities[1].mapUrl).toBe('https://m')
  })

  it('maps a redacted view without days or dates and does not crash', () => {
    const t = toTrip({
      id: 'j2',
      slug: 's',
      title: 'Secret',
      destination: 'Osaka, Japan',
      country: 'Japan',
      visibility: 'public',
      owner: full.owner,
      status: { state: 'upcoming', days_until: 9, day_number: 0, total_days: 4 },
      redacted: true,
      role: '',
    })
    expect(t.redacted).toBe(true)
    expect(t.days).toEqual([])
    expect(t.startDate).toBe('')
    expect(t.endDate).toBe('')
    expect(t.members).toBeUndefined()
    expect(t.live).toBeUndefined()
    expect(t.role).toBe('')
    expect(t.destination).toBe('Osaka')
  })

  it('maps a legacy view with no owner, status or role', () => {
    const t = toTrip({
      id: 'j3',
      slug: 'old',
      title: 'Old',
      destination: 'Rome',
      country: 'Italy',
      departure_date: '2024-01-01T00:00:00Z',
      return_date: '2024-01-02T00:00:00Z',
      itinerary_days: [],
    })
    expect(t.owner).toBeUndefined()
    expect(t.status).toBeUndefined()
    expect(t.redacted).toBe(false)
    expect(t.role).toBe('')
    expect(t.destination).toBe('Rome')
    expect(t.startDate).toBe('2024-01-01')
  })
})

describe('toTripList', () => {
  it('maps list items with cover and status', () => {
    const [t] = toTripList([
      {
        country: 'Japan',
        plan: [
          {
            id: 'j1',
            slug: 's',
            title: 'T',
            destination: 'Kyoto, Japan',
            cover_url: 'https://c',
            status,
          },
        ],
      },
    ])
    expect(t).toMatchObject({
      country: 'Japan',
      coverUrl: 'https://c',
      status,
      destination: 'Kyoto',
    })
  })
})

describe('toTripListFromMine', () => {
  it('maps my journeys with role', () => {
    const [t] = toTripListFromMine([
      {
        slug: 's',
        title: 'T',
        destination: 'Kyoto',
        departure_date: '2026-12-01T00:00:00Z',
        return_date: '2026-12-03T00:00:00Z',
        role: 'traveler',
      },
    ])
    expect(t).toMatchObject({ slug: 's', role: 'traveler', startDate: '2026-12-01' })
  })
})

describe('toTrip settings', () => {
  const base = { id: 'j', slug: 's', title: 'T', destination: 'X', country: 'Y' } as JourneyView
  it('maps the member-only settings', () => {
    const trip = toTrip({
      ...base,
      settings: {
        is_draft: true,
        timezone: 'Asia/Tokyo',
        hide_live_status: true,
        editors_can_invite: false,
      },
    })
    expect(trip.settings).toEqual({
      isDraft: true,
      timezone: 'Asia/Tokyo',
      hideLiveStatus: true,
      editorsCanInvite: false,
    })
  })
  it('leaves settings undefined when the server omits them', () => {
    expect(toTrip(base).settings).toBeUndefined()
  })
})
