import { describe, expect, it } from 'vitest'

import { toJourneyPayload } from './mapper'

describe('toJourneyPayload', () => {
  it('sends plan category and the trip visibility', () => {
    const payload = toJourneyPayload({
      title: 'T',
      destination: 'Nagoya',
      country: 'Japan',
      startDate: '2026-12-01',
      endDate: '2026-12-01',
      visibility: 'private',
      days: [
        {
          id: 'd',
          date: 'Dec 1',
          dateISO: '2026-12-01',
          title: 'Day',
          activities: [
            { id: 'a', time: '15:00', description: 'Hotel', category: 'stay' },
            { id: 'b', time: '', description: 'Walk' },
          ],
        },
      ],
    })
    expect(payload.visibility).toBe('private')
    expect(payload.itinerary_days[0].plans).toEqual([
      { time: '15:00', description: 'Hotel', map_url: undefined, category: 'stay', sort_order: 1 },
      { time: '', description: 'Walk', map_url: undefined, category: '', sort_order: 2 },
    ])
  })

  it('omits visibility when the form has none (server default applies)', () => {
    const payload = toJourneyPayload({
      title: 'T',
      destination: 'Nagoya',
      country: 'Japan',
      startDate: '2026-12-01',
      endDate: '2026-12-01',
      days: [],
    })
    expect(payload.visibility).toBeUndefined()
  })
})
