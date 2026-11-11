import { describe, expect, it } from 'vitest'

import { coverGradient } from './cover-gradient'
import { feedCover } from './feed-cover'

import type { FeedItem } from '@/api/feed/type'

const base = (over: Partial<FeedItem> = {}): FeedItem => ({
  id: 'f1',
  type: 'trip_planned',
  at: '2026-11-09T00:00:00Z',
  actor: { username: 'ann', display_name: 'Ann', avatar_url: '', bio: '' },
  trip: { slug: 'tokyo-1', title: 'T', destination: 'Tokyo', country: 'JP', cover_url: '' },
  companions: [],
  ...over,
})

const moments = (thumbs: string[]) => ({ count: thumbs.length, day_id: 'd1', day_title: 'D', thumbs })

describe('feedCover', () => {
  it('uses the first moment thumb, with up to three more as extras', () => {
    const item = base({
      type: 'moments_added',
      trip: { ...base().trip, cover_url: 'https://cdn.test/cover.jpg' },
      moments: moments([
        'https://cdn.test/1.jpg',
        'https://cdn.test/2.jpg',
        'https://cdn.test/3.jpg',
        'https://cdn.test/4.jpg',
        'https://cdn.test/5.jpg',
      ]),
    })
    expect(feedCover(item)).toEqual({
      kind: 'photo',
      src: 'https://cdn.test/1.jpg',
      extras: ['https://cdn.test/2.jpg', 'https://cdn.test/3.jpg', 'https://cdn.test/4.jpg'],
    })
  })

  it('skips unsafe thumbs', () => {
    const item = base({
      type: 'moments_added',
      moments: moments(['javascript:alert(1)', 'https://cdn.test/2.jpg']),
    })
    expect(feedCover(item)).toEqual({ kind: 'photo', src: 'https://cdn.test/2.jpg', extras: [] })
  })

  it('falls back to the https trip cover', () => {
    const item = base({ trip: { ...base().trip, cover_url: 'https://cdn.test/cover.jpg' } })
    expect(feedCover(item)).toEqual({ kind: 'cover', src: 'https://cdn.test/cover.jpg' })
  })

  it('uses the trip cover for a moments item without usable thumbs', () => {
    const item = base({
      type: 'moments_added',
      trip: { ...base().trip, cover_url: 'https://cdn.test/cover.jpg' },
      moments: moments([]),
    })
    expect(feedCover(item)).toEqual({ kind: 'cover', src: 'https://cdn.test/cover.jpg' })
  })

  it('falls back to the slug gradient when there is no photo', () => {
    const item = base({ trip: { ...base().trip, cover_url: 'http://insecure.test/c.jpg' } })
    expect(feedCover(item)).toEqual({ kind: 'gradient', background: coverGradient('tokyo-1') })
  })
})
