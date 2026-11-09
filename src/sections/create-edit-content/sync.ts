import * as itineraryApi from '@/api/itinerary'

import type { DayBody, JourneyPatchBody, PlanBody } from '@/api/itinerary/type'
import type { Activity, Trip, TripDay } from '@/types/trip'

// A day or plan is either one the server already has (id from the loaded snapshot) or one
// this save creates (temp = its client id, resolved to the real id once the add returns).
export type Ref = { server: string } | { temp: string }

export type SyncOp =
  | { type: 'patchTrip'; patch: JourneyPatchBody }
  | { type: 'addDay'; temp: string; body: DayBody }
  | { type: 'updateDay'; dayId: string; body: DayBody }
  | { type: 'addPlan'; temp: string; day: Ref; body: PlanBody }
  | { type: 'updatePlan'; planId: string; body: PlanBody; moveTo?: Ref }
  | { type: 'reorder'; day: Ref; plans: Ref[] }
  | { type: 'deletePlan'; planId: string }
  | { type: 'deleteDay'; dayId: string }

const toISO = (date: string) => (date.includes('T') ? date : `${date}T00:00:00Z`)
const planFields = (a: Activity) => ({
  time: a.time ?? '',
  description: a.description ?? '',
  map_url: a.mapUrl ?? '',
  category: a.category ?? '',
})

const sameList = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, i) => id === b[i])

// Diffs the trip as loaded at edit start (`original`) against the form (`edited`).
// Safety rules (other people may edit the same trip meanwhile):
// - only ids found in `original` are ever updated, moved or deleted;
// - anything else in `edited` is new and gets added;
// - items the server has but `original` lacks are never mentioned, so they survive.
// Ops come out in the order they must run: patch, add days, update days, add plans,
// update/move plans, reorder, delete plans, delete days.
export function planSync(original: Trip, edited: Trip): SyncOp[] {
  const origDays = new Map(original.days.map((d) => [d.id, d]))
  const origPlanDay = new Map<string, string>()
  const origPlans = new Map<string, Activity>()
  for (const d of original.days)
    for (const a of d.activities) {
      origPlanDay.set(a.id, d.id)
      origPlans.set(a.id, a)
    }

  // Where each item sits in the form; refuse ambiguous input rather than guess.
  const editedDayIds = new Set<string>()
  const editedPlanDay = new Map<string, string>()
  for (const d of edited.days) {
    if (editedDayIds.has(d.id)) throw new Error(`Duplicate day id ${d.id}`)
    editedDayIds.add(d.id)
    for (const a of d.activities) {
      if (editedPlanDay.has(a.id)) throw new Error(`Duplicate activity id ${a.id}`)
      editedPlanDay.set(a.id, d.id)
    }
  }

  const isServerDay = (id: string) => origDays.has(id)
  const isServerPlan = (id: string) => origPlans.has(id)
  const dayRef = (id: string): Ref => (isServerDay(id) ? { server: id } : { temp: id })
  const planRef = (id: string): Ref => (isServerPlan(id) ? { server: id } : { temp: id })

  const ops: SyncOp[] = []

  // 1. Trip fields.
  const patch: JourneyPatchBody = {}
  if (edited.title !== original.title) patch.title = edited.title
  if (edited.destination !== original.destination) patch.destination = edited.destination
  if (edited.country !== original.country) patch.country = edited.country
  if (edited.startDate !== original.startDate) patch.departure_date = toISO(edited.startDate)
  if (edited.endDate !== original.endDate) patch.return_date = toISO(edited.endDate)
  if (Object.keys(patch).length > 0) ops.push({ type: 'patchTrip', patch })

  // 2. New days.
  for (const d of edited.days)
    if (!isServerDay(d.id))
      ops.push({
        type: 'addDay',
        temp: d.id,
        body: { date: d.date, date_iso: toISO(d.dateISO), title: d.title },
      })

  // 3. Changed days.
  for (const d of edited.days) {
    const o = origDays.get(d.id)
    if (!o) continue
    const body: DayBody = {}
    if (d.date !== o.date) body.date = d.date
    if (d.dateISO !== o.dateISO) body.date_iso = toISO(d.dateISO)
    if (d.title !== o.title) body.title = d.title
    if (Object.keys(body).length > 0) ops.push({ type: 'updateDay', dayId: d.id, body })
  }

  // 4. New plans, in form order (each is appended last on the server).
  for (const d of edited.days)
    for (const a of d.activities)
      if (!isServerPlan(a.id))
        ops.push({ type: 'addPlan', temp: a.id, day: dayRef(d.id), body: planFields(a) })

  // 5. Changed or moved plans (a move is appended last on the target day).
  for (const d of edited.days)
    for (const a of d.activities) {
      const o = origPlans.get(a.id)
      if (!o) continue
      const now = planFields(a)
      const was = planFields(o)
      const body: PlanBody = {}
      for (const k of Object.keys(now) as (keyof typeof now)[])
        if (now[k] !== was[k]) body[k] = now[k]
      const moved = origPlanDay.get(a.id) !== d.id
      if (moved) ops.push({ type: 'updatePlan', planId: a.id, body, moveTo: dayRef(d.id) })
      else if (Object.keys(body).length > 0) ops.push({ type: 'updatePlan', planId: a.id, body })
    }

  // 6. Reorder each day whose order after steps 4–5 differs from the form. Deletes run
  // later, so the day still holds its deleted plans: the API wants the exact set, so they
  // are listed at the end (their position doesn't matter).
  const deleted = (id: string) => !editedPlanDay.has(id)
  for (const d of edited.days) {
    const ids = d.activities.map((a) => a.id)
    const kept = isServerDay(d.id)
      ? origDays
          .get(d.id)!
          .activities.map((a) => a.id)
          .filter((id) => deleted(id) || editedPlanDay.get(id) === d.id)
      : []
    const added = ids.filter((id) => !isServerPlan(id))
    const movedIn = ids.filter((id) => isServerPlan(id) && origPlanDay.get(id) !== d.id)
    const expected = [...kept, ...added, ...movedIn].filter((id) => !deleted(id))
    if (sameList(expected, ids)) continue
    ops.push({
      type: 'reorder',
      day: dayRef(d.id),
      plans: [...ids.map(planRef), ...kept.filter(deleted).map((id) => ({ server: id }))],
    })
  }

  // 7. Plans the user removed (only ones from the snapshot).
  for (const id of origPlans.keys()) if (deleted(id)) ops.push({ type: 'deletePlan', planId: id })

  // 8. Days the user removed (only ones from the snapshot).
  for (const id of origDays.keys())
    if (!editedDayIds.has(id)) ops.push({ type: 'deleteDay', dayId: id })

  return ops
}

export type SyncApi = Pick<
  typeof itineraryApi,
  | 'patchJourney'
  | 'addDay'
  | 'updateDay'
  | 'deleteDay'
  | 'addPlan'
  | 'updatePlan'
  | 'deletePlan'
  | 'reorderPlans'
>

const httpStatus = (error: unknown) =>
  (error as { response?: { status?: number } } | null)?.response?.status

// `message`: a ready-to-show explanation for failures the user can act on.
export type SyncResult =
  { ok: true } | { ok: false; index: number; op: SyncOp; error: unknown; message?: string }

export const DAY_HAS_MOMENTS_MESSAGE = 'ลบวันที่มีรูปไม่ได้ ลบรูปในวันนั้นก่อน'

const isDayHasMoments = (op: SyncOp, error: unknown) =>
  op.type === 'deleteDay' &&
  httpStatus(error) === 409 &&
  (error as { response?: { data?: { message?: unknown } } }).response?.data?.message ===
    'day has moments'

// Runs ops one by one; stops at the first failure (the caller reloads the trip).
export async function runSync(
  slug: string,
  ops: SyncOp[],
  api: SyncApi = itineraryApi,
): Promise<SyncResult> {
  const real = new Map<string, string>()
  const resolve = (ref: Ref): string => {
    if ('server' in ref) return ref.server
    const id = real.get(ref.temp)
    if (!id) throw new Error(`Unresolved new item ${ref.temp}`)
    return id
  }
  const created = (id: string | undefined, temp: string) => {
    if (!id) throw new Error(`No id returned for new item ${temp}`)
    real.set(temp, id)
  }

  for (let index = 0; index < ops.length; index++) {
    const op = ops[index]
    try {
      switch (op.type) {
        case 'patchTrip':
          await api.patchJourney(slug, op.patch)
          break
        case 'addDay':
          created((await api.addDay(slug, op.body))?.id, op.temp)
          break
        case 'updateDay':
          await api.updateDay(slug, op.dayId, op.body)
          break
        case 'addPlan': {
          const dayId = resolve(op.day)
          created((await api.addPlan(slug, dayId, op.body))?.id, op.temp)
          break
        }
        case 'updatePlan': {
          const body = op.moveTo ? { ...op.body, day_id: resolve(op.moveTo) } : op.body
          await api.updatePlan(slug, op.planId, body)
          break
        }
        case 'reorder': {
          const dayId = resolve(op.day)
          await api.reorderPlans(slug, dayId, op.plans.map(resolve))
          break
        }
        case 'deletePlan':
          await api.deletePlan(slug, op.planId)
          break
        case 'deleteDay':
          await api.deleteDay(slug, op.dayId)
          break
      }
    } catch (error) {
      // Deleting something that is already gone is the outcome we wanted.
      if ((op.type === 'deletePlan' || op.type === 'deleteDay') && httpStatus(error) === 404)
        continue
      if (isDayHasMoments(op, error))
        return { ok: false, index, op, error, message: DAY_HAS_MOMENTS_MESSAGE }
      return { ok: false, index, op, error }
    }
  }
  return { ok: true }
}

const OP_LABELS: Record<SyncOp['type'], string> = {
  patchTrip: 'updating trip details',
  addDay: 'adding a day',
  updateDay: 'updating a day',
  addPlan: 'adding an activity',
  updatePlan: 'updating an activity',
  reorder: 'reordering activities',
  deletePlan: 'deleting an activity',
  deleteDay: 'deleting a day',
}

export const describeOp = (op: SyncOp) => OP_LABELS[op.type]

const isEmptyActivity = (a: Activity) =>
  !a.time?.trim() && !a.description?.trim() && !a.mapUrl?.trim() && !a.category

// Drops rows the user added but never filled in. Server plans are always kept, so a
// cleared server plan is caught by findBlankActivity instead of being deleted silently.
export const dropEmptyNewActivities = (days: TripDay[], serverPlanIds: Set<string>): TripDay[] =>
  days.map((d) => ({
    ...d,
    activities: d.activities.filter((a) => serverPlanIds.has(a.id) || !isEmptyActivity(a)),
  }))

const MAX_URL_BYTES = 2048

// Mirrors the backend's map_url rule: empty is fine; a value without a scheme (and no
// "host:port" head) gets https:// prefixed; then only http(s) with a host, at most 2048
// bytes. Returns the normalized URL, or null when the backend would reject it.
export const normalizeMapUrl = (raw: string): string | null => {
  let s = raw
  if (s === '') return ''
  if (!s.includes('://') && !s.split('/')[0].includes(':')) s = `https://${s}`
  if (new TextEncoder().encode(s).length > MAX_URL_BYTES) return null
  // WHATWG URL is laxer than Go's url.Parse (e.g. "http:///x"), so check the shape first.
  if (!/^https?:\/\/[^/\\?#\s]+/i.test(s)) return null
  try {
    const u = new URL(s)
    if ((u.protocol !== 'http:' && u.protocol !== 'https:') || !u.host) return null
  } catch {
    return null
  }
  return s
}

export const activityErrorKey = (id: string, field: 'description' | 'mapUrl') =>
  `activity.${id}.${field}`

// Field errors for plans the API would reject. Only new plans and fields the user changed
// are checked, so untouched legacy plans (blank or odd data) never block a save.
// `original` is the edit snapshot, or null when creating.
export const validateActivities = (
  days: TripDay[],
  original: Trip | null,
): Record<string, string> => {
  const before = new Map<string, Activity>()
  for (const d of original?.days ?? []) for (const a of d.activities) before.set(a.id, a)
  const errors: Record<string, string> = {}
  for (const d of days)
    for (const a of d.activities) {
      const o = before.get(a.id)
      if ((!o || a.description !== o.description) && !a.description?.trim())
        errors[activityErrorKey(a.id, 'description')] = 'Description is required'
      const url = a.mapUrl ?? ''
      if ((!o || url !== (o.mapUrl ?? '')) && normalizeMapUrl(url) === null)
        errors[activityErrorKey(a.id, 'mapUrl')] = 'Enter an http(s) link'
    }
  return errors
}

// Preflight, run against a fresh GET right before any write. Returns problems (empty =
// safe to sync). Each one means someone else changed something our ops depend on:
// (a) a day we reorder must still hold exactly its snapshot plans (our computed order
//     assumes it, and the API wants the exact set);
// (b) a day we delete may only hold snapshot plans of that day (deleting it cascades);
// (c) every server id we update, add to, move or reorder must still exist. Delete targets
//     are exempt: already gone is fine (a 404 on delete counts as success).
export const checkPreconditions = (original: Trip, fresh: Trip, ops: SyncOp[]): string[] => {
  const planIds = (t: Trip) =>
    new Map(t.days.map((d) => [d.id, new Set(d.activities.map((a) => a.id))]))
  const snap = planIds(original)
  const now = planIds(fresh)
  const freshPlans = new Set([...now.values()].flatMap((ids) => [...ids]))
  const problems = new Set<string>()
  const needDay = (id: string) => {
    if (!now.has(id)) problems.add(`missing:${id}`)
  }
  const needPlan = (id: string) => {
    if (!freshPlans.has(id)) problems.add(`missing:${id}`)
  }
  const needRef = (ref: Ref, kind: 'day' | 'plan') => {
    if ('server' in ref) (kind === 'day' ? needDay : needPlan)(ref.server)
  }
  const sameSet = (a: Set<string>, b: Set<string>) =>
    a.size === b.size && [...a].every((id) => b.has(id))

  for (const op of ops) {
    switch (op.type) {
      case 'updateDay':
        needDay(op.dayId)
        break
      case 'addPlan':
        needRef(op.day, 'day')
        break
      case 'updatePlan':
        needPlan(op.planId)
        if (op.moveTo) needRef(op.moveTo, 'day')
        break
      case 'reorder': {
        needRef(op.day, 'day')
        op.plans.forEach((p) => needRef(p, 'plan'))
        if ('server' in op.day) {
          const current = now.get(op.day.server)
          if (current && !sameSet(current, snap.get(op.day.server) ?? new Set()))
            problems.add(`reorder:${op.day.server}`)
        }
        break
      }
      case 'deleteDay': {
        const current = now.get(op.dayId)
        const allowed = snap.get(op.dayId) ?? new Set<string>()
        if (current && [...current].some((id) => !allowed.has(id)))
          problems.add(`deleteDay:${op.dayId}`)
        break
      }
    }
  }
  return [...problems]
}
