import { describe, expect, it } from 'vitest'

import { storyGroups } from './story-groups'

import type { MomentView } from '@/api/moments/type'

const m = (id: string, username: string) =>
  ({
    id,
    uploader: { username, display_name: username.toUpperCase(), avatar_url: '', bio: '' },
  }) as unknown as MomentView

describe('storyGroups', () => {
  it('returns [] for an empty list', () => {
    expect(storyGroups([])).toEqual([])
  })

  it('groups by uploader in first-appearance order with start index and count', () => {
    const groups = storyGroups([m('1', 'mint'), m('2', 'ploy'), m('3', 'mint'), m('4', 'kip')])
    expect(groups.map((g) => [g.uploader.username, g.start, g.count])).toEqual([
      ['mint', 0, 2],
      ['ploy', 1, 1],
      ['kip', 3, 1],
    ])
    expect(groups[0].uploader.display_name).toBe('MINT')
  })
})
