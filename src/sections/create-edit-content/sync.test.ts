import { describe, expect, it, vi } from 'vitest'

import {
  activityErrorKey,
  checkPreconditions,
  describeOp,
  dropEmptyNewActivities,
  normalizeMapUrl,
  planSync,
  runSync,
  type SyncApi,
  type SyncOp,
  validateActivities,
} from './sync'

import type { Activity, Trip, TripDay } from '@/types/trip'

const act = (id: string, extra: Partial<Activity> = {}): Activity => ({
  id,
  time: '',
  description: `do ${id}`,
  ...extra,
})

const day = (id: string, dateISO: string, activities: Activity[] = []): TripDay => ({
  id,
  date: `date ${dateISO}`,
  dateISO,
  title: `title ${id}`,
  activities,
})

// Server snapshot: d1 [p1, p2, p3], d2 [p4], d3 [].
const snapshot = (): Trip => ({
  id: 'j1',
  slug: 'nagoya',
  title: 'Nagoya',
  destination: 'Nagoya',
  country: 'Japan',
  startDate: '2026-12-01',
  endDate: '2026-12-03',
  role: 'editor',
  days: [
    day('d1', '2026-12-01', [act('p1'), act('p2', { mapUrl: 'https://m/2' }), act('p3')]),
    day('d2', '2026-12-02', [act('p4', { category: 'stay' })]),
    day('d3', '2026-12-03'),
  ],
})

const clone = (t: Trip): Trip => structuredClone(t)
const dayOf = (t: Trip, id: string) => t.days.find((d) => d.id === id)!
const types = (ops: SyncOp[]) => ops.map((o) => o.type)

describe('planSync', () => {
  it('returns no ops for an untouched trip', () => {
    expect(planSync(snapshot(), clone(snapshot()))).toEqual([])
  })

  it('treats a missing mapUrl/category the same as an empty one', () => {
    const edited = clone(snapshot())
    dayOf(edited, 'd1').activities[0] = { ...act('p1'), mapUrl: '', category: '' }
    expect(planSync(snapshot(), edited)).toEqual([])
  })

  it('patches only the changed trip fields', () => {
    const edited = clone(snapshot())
    edited.title = 'Nagoya & Gifu'
    edited.endDate = '2026-12-03'
    edited.startDate = '2026-11-30'
    edited.days.unshift(day('n0', '2026-11-30'))
    const ops = planSync(snapshot(), edited)
    expect(ops[0]).toEqual({
      type: 'patchTrip',
      patch: { title: 'Nagoya & Gifu', departure_date: '2026-11-30T00:00:00Z' },
    })
  })

  it('patches destination, country and return date', () => {
    const edited = clone(snapshot())
    edited.destination = 'Osaka'
    edited.country = 'Japan '
    edited.endDate = '2026-12-04'
    edited.days.push(day('n4', '2026-12-04'))
    expect(planSync(snapshot(), edited)[0]).toEqual({
      type: 'patchTrip',
      patch: { destination: 'Osaka', country: 'Japan ', return_date: '2026-12-04T00:00:00Z' },
    })
  })

  it('adds a new day with its new plans, referencing the day by temp key', () => {
    const edited = clone(snapshot())
    edited.endDate = '2026-12-04'
    edited.days.push(
      day('n4', '2026-12-04', [act('a', { time: '09:00', category: 'food' }), act('b')]),
    )
    const ops = planSync(snapshot(), edited)
    expect(ops).toEqual([
      { type: 'patchTrip', patch: { return_date: '2026-12-04T00:00:00Z' } },
      {
        type: 'addDay',
        temp: 'n4',
        body: { date: 'date 2026-12-04', date_iso: '2026-12-04T00:00:00Z', title: 'title n4' },
      },
      {
        type: 'addPlan',
        temp: 'a',
        day: { temp: 'n4' },
        body: { time: '09:00', description: 'do a', map_url: '', category: 'food' },
      },
      {
        type: 'addPlan',
        temp: 'b',
        day: { temp: 'n4' },
        body: { time: '', description: 'do b', map_url: '', category: '' },
      },
    ])
  })

  it('updates only the changed day fields', () => {
    const edited = clone(snapshot())
    dayOf(edited, 'd2').title = 'Ghibli Park'
    expect(planSync(snapshot(), edited)).toEqual([
      { type: 'updateDay', dayId: 'd2', body: { title: 'Ghibli Park' } },
    ])
  })

  it('updates a day date and date_iso', () => {
    const edited = clone(snapshot())
    Object.assign(dayOf(edited, 'd3'), { date: 'Dec 9', dateISO: '2026-12-09' })
    expect(planSync(snapshot(), edited)).toEqual([
      {
        type: 'updateDay',
        dayId: 'd3',
        body: { date: 'Dec 9', date_iso: '2026-12-09T00:00:00Z' },
      },
    ])
  })

  it('updates only the changed plan fields', () => {
    const edited = clone(snapshot())
    const d1 = dayOf(edited, 'd1')
    d1.activities[0] = { ...d1.activities[0], time: '10:00', category: 'sight' }
    d1.activities[1] = { ...d1.activities[1], description: 'Atsuta', mapUrl: undefined }
    expect(planSync(snapshot(), edited)).toEqual([
      { type: 'updatePlan', planId: 'p1', body: { time: '10:00', category: 'sight' } },
      { type: 'updatePlan', planId: 'p2', body: { description: 'Atsuta', map_url: '' } },
    ])
  })

  it('appends a new plan to an existing day without a reorder', () => {
    const edited = clone(snapshot())
    dayOf(edited, 'd1').activities.push(act('x'))
    expect(planSync(snapshot(), edited)).toEqual([
      {
        type: 'addPlan',
        temp: 'x',
        day: { server: 'd1' },
        body: { time: '', description: 'do x', map_url: '', category: '' },
      },
    ])
  })

  it('reorders when a new plan is inserted before existing ones', () => {
    const edited = clone(snapshot())
    dayOf(edited, 'd1').activities.unshift(act('x'))
    const ops = planSync(snapshot(), edited)
    expect(types(ops)).toEqual(['addPlan', 'reorder'])
    expect(ops[1]).toEqual({
      type: 'reorder',
      day: { server: 'd1' },
      plans: [{ temp: 'x' }, { server: 'p1' }, { server: 'p2' }, { server: 'p3' }],
    })
  })

  it('reorders only the day whose order changed', () => {
    const edited = clone(snapshot())
    const d1 = dayOf(edited, 'd1')
    d1.activities = [d1.activities[2], d1.activities[0], d1.activities[1]]
    expect(planSync(snapshot(), edited)).toEqual([
      {
        type: 'reorder',
        day: { server: 'd1' },
        plans: [{ server: 'p3' }, { server: 'p1' }, { server: 'p2' }],
      },
    ])
  })

  it('moves a plan to the end of another day without a reorder', () => {
    const edited = clone(snapshot())
    const p4 = dayOf(edited, 'd2').activities.pop()!
    dayOf(edited, 'd1').activities.push(p4)
    expect(planSync(snapshot(), edited)).toEqual([
      { type: 'updatePlan', planId: 'p4', body: {}, moveTo: { server: 'd1' } },
    ])
  })

  it('moves a plan into the middle of another day and reorders that day', () => {
    const edited = clone(snapshot())
    const p4 = dayOf(edited, 'd2').activities.pop()!
    dayOf(edited, 'd1').activities.splice(1, 0, { ...p4, time: '12:00' })
    expect(planSync(snapshot(), edited)).toEqual([
      { type: 'updatePlan', planId: 'p4', body: { time: '12:00' }, moveTo: { server: 'd1' } },
      {
        type: 'reorder',
        day: { server: 'd1' },
        plans: [{ server: 'p1' }, { server: 'p4' }, { server: 'p2' }, { server: 'p3' }],
      },
    ])
  })

  it('moving a plan out of a day keeps the rest of that day in order', () => {
    const edited = clone(snapshot())
    const [p1] = dayOf(edited, 'd1').activities.splice(0, 1)
    dayOf(edited, 'd2').activities.push(p1)
    expect(planSync(snapshot(), edited)).toEqual([
      { type: 'updatePlan', planId: 'p1', body: {}, moveTo: { server: 'd2' } },
    ])
  })

  it('moves a server plan into a new day by temp key', () => {
    const edited = clone(snapshot())
    edited.endDate = '2026-12-04'
    const p4 = dayOf(edited, 'd2').activities.pop()!
    edited.days.push(day('n4', '2026-12-04', [p4, act('a')]))
    const ops = planSync(snapshot(), edited)
    expect(types(ops)).toEqual(['patchTrip', 'addDay', 'addPlan', 'updatePlan', 'reorder'])
    expect(ops[3]).toEqual({ type: 'updatePlan', planId: 'p4', body: {}, moveTo: { temp: 'n4' } })
    // After ops the new day holds [a, p4] (add, then move appends): reorder to [p4, a].
    expect(ops[4]).toEqual({
      type: 'reorder',
      day: { temp: 'n4' },
      plans: [{ server: 'p4' }, { temp: 'a' }],
    })
  })

  it('deletes a removed plan without reordering the rest', () => {
    const edited = clone(snapshot())
    dayOf(edited, 'd1').activities.splice(1, 1)
    expect(planSync(snapshot(), edited)).toEqual([{ type: 'deletePlan', planId: 'p2' }])
  })

  it('a reorder sent before a delete still lists the to-be-deleted plan (exact-set rule)', () => {
    const edited = clone(snapshot())
    const d1 = dayOf(edited, 'd1')
    d1.activities = [d1.activities[2], d1.activities[0]] // p3, p1; p2 deleted
    expect(planSync(snapshot(), edited)).toEqual([
      {
        type: 'reorder',
        day: { server: 'd1' },
        plans: [{ server: 'p3' }, { server: 'p1' }, { server: 'p2' }],
      },
      { type: 'deletePlan', planId: 'p2' },
    ])
  })

  it('deletes removed days after their removed plans', () => {
    const edited = clone(snapshot())
    edited.endDate = '2026-12-01'
    edited.days = edited.days.filter((d) => d.id === 'd1')
    expect(planSync(snapshot(), edited)).toEqual([
      { type: 'patchTrip', patch: { return_date: '2026-12-01T00:00:00Z' } },
      { type: 'deletePlan', planId: 'p4' },
      { type: 'deleteDay', dayId: 'd2' },
      { type: 'deleteDay', dayId: 'd3' },
    ])
  })

  it('moves a plan out of a day before deleting that day', () => {
    const edited = clone(snapshot())
    const p4 = dayOf(edited, 'd2').activities.pop()!
    dayOf(edited, 'd1').activities.push(p4)
    edited.days = edited.days.filter((d) => d.id !== 'd2')
    expect(planSync(snapshot(), edited)).toEqual([
      { type: 'updatePlan', planId: 'p4', body: {}, moveTo: { server: 'd1' } },
      { type: 'deleteDay', dayId: 'd2' },
    ])
  })

  it('never deletes plans or days that were not in the loaded snapshot', () => {
    // Someone else added pX to d1 and day dX after we loaded; the server now has them,
    // but the snapshot (original) and the form (edited) do not.
    const original = snapshot()
    const edited = clone(original)
    dayOf(edited, 'd1').activities.splice(0, 1)
    edited.days = edited.days.filter((d) => d.id !== 'd3')
    const ops = planSync(original, edited)
    expect(ops).toEqual([
      { type: 'deletePlan', planId: 'p1' },
      { type: 'deleteDay', dayId: 'd3' },
    ])
    expect(JSON.stringify(ops)).not.toMatch(/pX|dX/)
  })

  it('treats ids unknown to the snapshot as new: added, never updated or deleted', () => {
    const original = snapshot()
    const edited = clone(original)
    dayOf(edited, 'd1').activities.push(act('pX'))
    const ops = planSync(original, edited)
    expect(ops).toEqual([
      {
        type: 'addPlan',
        temp: 'pX',
        day: { server: 'd1' },
        body: { time: '', description: 'do pX', map_url: '', category: '' },
      },
    ])
  })

  it('only ever names server ids that were in the snapshot', () => {
    const original = snapshot()
    const edited = clone(original)
    edited.title = 'T'
    edited.endDate = '2026-12-04'
    const d1 = dayOf(edited, 'd1')
    d1.activities = [act('new1'), d1.activities[2], d1.activities[0]]
    const p4 = dayOf(edited, 'd2').activities.pop()!
    edited.days = edited.days.filter((d) => d.id !== 'd2')
    edited.days.push(day('n4', '2026-12-04', [act('new2'), p4]))
    const ops = planSync(original, edited)
    const known = new Set(['d1', 'd2', 'd3', 'p1', 'p2', 'p3', 'p4'])
    const serverIds = JSON.stringify(ops).match(/"(server|dayId|planId)":"([^"]+)"/g) ?? []
    for (const m of serverIds) expect(known.has(m.split(':')[1].replace(/"/g, ''))).toBe(true)
    expect(types(ops)).toEqual([
      'patchTrip',
      'addDay',
      'addPlan',
      'addPlan',
      'updatePlan',
      'reorder',
      'deletePlan',
      'deleteDay',
    ])
  })

  it('refuses a form with duplicate ids instead of guessing', () => {
    const edited = clone(snapshot())
    dayOf(edited, 'd2').activities.push(act('p1'))
    expect(() => planSync(snapshot(), edited)).toThrow(/duplicate/i)
  })
})

describe('dropEmptyNewActivities', () => {
  it('drops untouched new rows but keeps server plans', () => {
    const days = [
      day('d1', '2026-12-01', [act('p1', { description: '' }), act('n', { description: '' })]),
    ]
    const out = dropEmptyNewActivities(days, new Set(['p1']))
    expect(out[0].activities.map((a) => a.id)).toEqual(['p1'])
  })

  it('keeps a new row that has anything filled in', () => {
    const days = [day('d1', '2026-12-01', [act('n', { description: ' ', time: '09:00' })])]
    expect(dropEmptyNewActivities(days, new Set())[0].activities).toHaveLength(1)
  })
})

describe('normalizeMapUrl (mirrors the backend)', () => {
  it.each([
    ['', ''],
    ['https://maps.google.com/?q=x', 'https://maps.google.com/?q=x'],
    ['http://a.example', 'http://a.example'],
    ['HTTPS://A.example/x', 'HTTPS://A.example/x'],
    ['maps.app.goo.gl/abc', 'https://maps.app.goo.gl/abc'],
  ])('accepts %j', (input, out) => {
    expect(normalizeMapUrl(input)).toBe(out)
  })

  it.each([
    ['javascript scheme', 'javascript:alert(1)'],
    ['ftp scheme', 'ftp://files.example/x'],
    ['no host', 'https://'],
    ['empty host', 'http:///nohost'],
    ['host:port without scheme', 'localhost:3000/x'],
    ['data scheme', 'data:text/html,hi'],
    ['space in host', 'https://exa mple.com'],
    ['over 2048 bytes', `https://a.example/${'x'.repeat(2040)}`],
    ['over 2048 bytes in UTF-8 (712 chars)', `https://a.example/${'ก'.repeat(700)}`],
  ])('rejects %s', (_label, input) => {
    expect(normalizeMapUrl(input)).toBeNull()
  })
})

describe('validateActivities', () => {
  const k = activityErrorKey

  it('checks new plans: blank description and bad map URL', () => {
    const edited = clone(snapshot())
    dayOf(edited, 'd1').activities.push(
      act('n1', { description: ' ' }),
      act('n2', { mapUrl: 'javascript:alert(1)' }),
      act('n3', { mapUrl: 'maps.app.goo.gl/ok' }),
    )
    expect(validateActivities(edited.days, snapshot())).toEqual({
      [k('n1', 'description')]: expect.any(String),
      [k('n2', 'mapUrl')]: expect.any(String),
    })
  })

  it('does not block on legacy blank or invalid plans the user did not touch', () => {
    const original = snapshot()
    dayOf(original, 'd1').activities[0] = act('p1', { description: '', mapUrl: 'notaurl:x' })
    expect(validateActivities(clone(original).days, original)).toEqual({})
  })

  it('checks server plans whose description or map URL changed', () => {
    const edited = clone(snapshot())
    const d1 = dayOf(edited, 'd1')
    d1.activities[0] = { ...d1.activities[0], description: '  ' }
    d1.activities[1] = { ...d1.activities[1], mapUrl: 'ftp://x.example' }
    expect(validateActivities(edited.days, snapshot())).toEqual({
      [k('p1', 'description')]: expect.any(String),
      [k('p2', 'mapUrl')]: expect.any(String),
    })
  })

  it('checks every plan when creating (no snapshot)', () => {
    const days = [day('n', '2026-12-01', [act('a', { description: '' })])]
    expect(Object.keys(validateActivities(days, null))).toEqual([k('a', 'description')])
  })
})

describe('checkPreconditions', () => {
  // fresh = what the server holds right before we write.
  const ops = (edit: (t: Trip) => void) => {
    const edited = clone(snapshot())
    edit(edited)
    return planSync(snapshot(), edited)
  }
  const reorderD1 = (t: Trip) => {
    const d1 = dayOf(t, 'd1')
    d1.activities = [d1.activities[2], d1.activities[0], d1.activities[1]]
  }

  it('passes when nobody else changed what we touch', () => {
    const o = ops((t) => {
      reorderD1(t)
      t.days = t.days.filter((d) => d.id !== 'd2')
      dayOf(t, 'd3').title = 'x'
    })
    expect(checkPreconditions(snapshot(), snapshot(), o)).toEqual([])
  })

  it('(a) fails when a day we reorder gained a plan from someone else', () => {
    const fresh = snapshot()
    dayOf(fresh, 'd1').activities.push(act('pX'))
    expect(checkPreconditions(snapshot(), fresh, ops(reorderD1))).toEqual(['reorder:d1'])
  })

  it('(a) fails when a day we reorder lost a plan', () => {
    const fresh = snapshot()
    dayOf(fresh, 'd1').activities.splice(1, 1)
    expect(checkPreconditions(snapshot(), fresh, ops(reorderD1))).toContain('reorder:d1')
  })

  it('(a) ignores changes on days we do not reorder', () => {
    const fresh = snapshot()
    dayOf(fresh, 'd2').activities.push(act('pX'))
    expect(checkPreconditions(snapshot(), fresh, ops(reorderD1))).toEqual([])
  })

  it('(b) fails when a day we delete holds a plan outside the snapshot', () => {
    const fresh = snapshot()
    dayOf(fresh, 'd2').activities.push(act('pX'))
    const o = ops((t) => {
      t.days = t.days.filter((d) => d.id !== 'd2')
    })
    expect(checkPreconditions(snapshot(), fresh, o)).toEqual(['deleteDay:d2'])
  })

  it('(b) fails when someone moved a snapshot plan into a day we delete', () => {
    const fresh = snapshot()
    const p1 = dayOf(fresh, 'd1').activities.shift()!
    dayOf(fresh, 'd3').activities.push(p1)
    const o = ops((t) => {
      t.days = t.days.filter((d) => d.id !== 'd3')
    })
    expect(checkPreconditions(snapshot(), fresh, o)).toEqual(['deleteDay:d3'])
  })

  it('(b) passes when the day we delete is already gone', () => {
    const fresh = snapshot()
    fresh.days = fresh.days.filter((d) => d.id !== 'd3')
    const o = ops((t) => {
      t.days = t.days.filter((d) => d.id !== 'd3')
    })
    expect(checkPreconditions(snapshot(), fresh, o)).toEqual([])
  })

  it('(c) fails when a plan we update is gone', () => {
    const fresh = snapshot()
    dayOf(fresh, 'd1').activities.shift()
    const o = ops((t) => {
      dayOf(t, 'd1').activities[0].time = '07:00'
    })
    expect(checkPreconditions(snapshot(), fresh, o)).toEqual(['missing:p1'])
  })

  it('(c) fails when a day we add to, update or move into is gone', () => {
    const fresh = snapshot()
    fresh.days = fresh.days.filter((d) => d.id === 'd2')
    const o = ops((t) => {
      dayOf(t, 'd3').activities.push(act('n'))
      dayOf(t, 'd3').title = 'x'
      const p4 = dayOf(t, 'd2').activities.pop()!
      dayOf(t, 'd1').activities.push(p4)
    })
    expect(checkPreconditions(snapshot(), fresh, o).sort()).toEqual(['missing:d1', 'missing:d3'])
  })

  it('(c) fails when a plan we move is gone', () => {
    const fresh = snapshot()
    dayOf(fresh, 'd2').activities = []
    const o = ops((t) => {
      const p4 = dayOf(t, 'd2').activities.pop()!
      dayOf(t, 'd1').activities.push(p4)
    })
    expect(checkPreconditions(snapshot(), fresh, o)).toEqual(['missing:p4'])
  })

  it('(c) a plan we delete that is already gone is fine', () => {
    const fresh = snapshot()
    dayOf(fresh, 'd1').activities.splice(1, 1)
    const o = ops((t) => {
      dayOf(t, 'd1').activities.splice(1, 1)
    })
    expect(checkPreconditions(snapshot(), fresh, o)).toEqual([])
  })

  it('fails everything on a redacted/empty fresh copy', () => {
    const fresh = { ...snapshot(), days: [] }
    const o = ops((t) => {
      dayOf(t, 'd1').activities[0].time = '07:00'
    })
    expect(checkPreconditions(snapshot(), fresh, o)).toEqual(['missing:p1'])
  })
})

const fakeApi = (): { [K in keyof SyncApi]: ReturnType<typeof vi.fn> } => ({
  patchJourney: vi.fn().mockResolvedValue(undefined),
  addDay: vi.fn().mockResolvedValue({ id: 'D9' }),
  updateDay: vi.fn().mockResolvedValue(undefined),
  deleteDay: vi.fn().mockResolvedValue(undefined),
  addPlan: vi.fn().mockResolvedValueOnce({ id: 'P9' }).mockResolvedValueOnce({ id: 'P10' }),
  updatePlan: vi.fn().mockResolvedValue(undefined),
  deletePlan: vi.fn().mockResolvedValue(undefined),
  reorderPlans: vi.fn().mockResolvedValue(undefined),
})

describe('runSync', () => {
  const ops: SyncOp[] = [
    { type: 'patchTrip', patch: { title: 'T' } },
    { type: 'addDay', temp: 'n4', body: { date: 'x', date_iso: '2026-12-04T00:00:00Z' } },
    { type: 'addPlan', temp: 'a', day: { temp: 'n4' }, body: { description: 'A' } },
    { type: 'addPlan', temp: 'b', day: { server: 'd1' }, body: { description: 'B' } },
    { type: 'updatePlan', planId: 'p4', body: {}, moveTo: { temp: 'n4' } },
    { type: 'updatePlan', planId: 'p1', body: { time: '08:00' } },
    { type: 'reorder', day: { temp: 'n4' }, plans: [{ server: 'p4' }, { temp: 'a' }] },
    { type: 'reorder', day: { server: 'd1' }, plans: [{ temp: 'b' }, { server: 'p1' }] },
    { type: 'deletePlan', planId: 'p2' },
    { type: 'deleteDay', dayId: 'd3' },
  ]

  it('runs ops in order and resolves temp keys to the ids the API returned', async () => {
    const api = fakeApi()
    await expect(runSync('s', ops, api as unknown as SyncApi)).resolves.toEqual({ ok: true })
    expect(api.patchJourney).toHaveBeenCalledWith('s', { title: 'T' })
    expect(api.addDay).toHaveBeenCalledWith('s', { date: 'x', date_iso: '2026-12-04T00:00:00Z' })
    expect(api.addPlan).toHaveBeenNthCalledWith(1, 's', 'D9', { description: 'A' })
    expect(api.addPlan).toHaveBeenNthCalledWith(2, 's', 'd1', { description: 'B' })
    expect(api.updatePlan).toHaveBeenNthCalledWith(1, 's', 'p4', { day_id: 'D9' })
    expect(api.updatePlan).toHaveBeenNthCalledWith(2, 's', 'p1', { time: '08:00' })
    expect(api.reorderPlans).toHaveBeenNthCalledWith(1, 's', 'D9', ['p4', 'P9'])
    expect(api.reorderPlans).toHaveBeenNthCalledWith(2, 's', 'd1', ['P10', 'p1'])
    expect(api.deletePlan).toHaveBeenCalledWith('s', 'p2')
    expect(api.deleteDay).toHaveBeenCalledWith('s', 'd3')
  })

  it('stops at the first error and reports the failing op', async () => {
    const api = fakeApi()
    const err = new Error('boom')
    api.addPlan.mockReset().mockRejectedValueOnce(err)
    const result = await runSync('s', ops, api as unknown as SyncApi)
    expect(result).toEqual({ ok: false, index: 2, op: ops[2], error: err })
    expect(api.updatePlan).not.toHaveBeenCalled()
    expect(api.reorderPlans).not.toHaveBeenCalled()
    expect(api.deletePlan).not.toHaveBeenCalled()
    expect(api.deleteDay).not.toHaveBeenCalled()
  })

  it('fails (and stops) when an add returns no id', async () => {
    const api = fakeApi()
    api.addDay.mockReset().mockResolvedValue({})
    const result = await runSync('s', ops, api as unknown as SyncApi)
    expect(result).toMatchObject({ ok: false, index: 1 })
    expect(api.addPlan).not.toHaveBeenCalled()
  })

  it('fails instead of sending an unresolved temp key', async () => {
    const api = fakeApi()
    const bad: SyncOp[] = [
      { type: 'addPlan', temp: 'a', day: { temp: 'never-added' }, body: { description: 'A' } },
    ]
    const result = await runSync('s', bad, api as unknown as SyncApi)
    expect(result).toMatchObject({ ok: false, index: 0 })
    expect(api.addPlan).not.toHaveBeenCalled()
  })

  it('treats a 404 on delete as already gone and continues', async () => {
    const api = fakeApi()
    const notFound = Object.assign(new Error('404'), { response: { status: 404 } })
    api.deletePlan.mockReset().mockRejectedValue(notFound)
    api.deleteDay.mockReset().mockRejectedValue(notFound)
    const del: SyncOp[] = [
      { type: 'deletePlan', planId: 'p2' },
      { type: 'deleteDay', dayId: 'd3' },
      { type: 'deleteDay', dayId: 'd2' },
    ]
    await expect(runSync('s', del, api as unknown as SyncApi)).resolves.toEqual({ ok: true })
    expect(api.deleteDay).toHaveBeenCalledTimes(2)
  })

  it('still stops on other delete errors and on a 404 elsewhere', async () => {
    const api = fakeApi()
    const forbidden = Object.assign(new Error('403'), { response: { status: 403 } })
    const notFound = Object.assign(new Error('404'), { response: { status: 404 } })
    api.deletePlan.mockReset().mockRejectedValue(forbidden)
    api.updatePlan.mockReset().mockRejectedValue(notFound)
    await expect(
      runSync('s', [{ type: 'deletePlan', planId: 'p2' }], api as unknown as SyncApi),
    ).resolves.toMatchObject({ ok: false, index: 0 })
    await expect(
      runSync(
        's',
        [{ type: 'updatePlan', planId: 'p1', body: { time: 'x' } }],
        api as unknown as SyncApi,
      ),
    ).resolves.toMatchObject({ ok: false, index: 0 })
  })

  it('describes each op for the error toast', () => {
    expect(ops.map(describeOp)).toEqual([
      'updating trip details',
      'adding a day',
      'adding an activity',
      'adding an activity',
      'updating an activity',
      'updating an activity',
      'reordering activities',
      'reordering activities',
      'deleting an activity',
      'deleting a day',
    ])
  })
})
