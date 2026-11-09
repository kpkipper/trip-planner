import { describe, expect, it } from 'vitest'

import { formatDuration, groupMoments } from './moments-by-day'

import type { MomentView } from '@/api/moments/type'

const m = (id: string, day_id: string, plan_id?: string | null) =>
  ({ id, day_id, plan_id }) as unknown as MomentView

describe('groupMoments', () => {
  it('puts day moments in byDay and plan moments only in byPlan', () => {
    const { byDay, byPlan } = groupMoments([
      m('1', 'd1'),
      m('2', 'd1', null),
      m('3', 'd1', 'p1'),
      m('4', 'd2', 'p2'),
      m('5', 'd2', 'p2'),
    ])
    expect(byDay.get('d1')?.map((x) => x.id)).toEqual(['1', '2'])
    expect(byDay.has('d2')).toBe(false)
    expect(byPlan.get('p1')?.map((x) => x.id)).toEqual(['3'])
    expect(byPlan.get('p2')?.map((x) => x.id)).toEqual(['4', '5'])
  })

  it('treats an empty plan_id as a day moment and handles an empty list', () => {
    expect(groupMoments([m('1', 'd1', '')]).byDay.get('d1')).toHaveLength(1)
    const empty = groupMoments([])
    expect(empty.byDay.size + empty.byPlan.size).toBe(0)
  })
})

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [4400, '0:04'],
    [83000, '1:23'],
    [60000, '1:00'],
    [-5, '0:00'],
  ])('%d ms -> %s', (ms, text) => expect(formatDuration(ms)).toBe(text))
})
