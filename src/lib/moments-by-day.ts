import type { MomentView } from '@/api/moments/type'

export interface GroupedMoments {
  byDay: Map<string, MomentView[]>
  byPlan: Map<string, MomentView[]>
}

const push = (map: Map<string, MomentView[]>, key: string, m: MomentView) => {
  const list = map.get(key)
  if (list) list.push(m)
  else map.set(key, [m])
}

// A moment with a plan_id belongs to that plan only; the rest belong to their day.
export const groupMoments = (moments: MomentView[]): GroupedMoments => {
  const byDay = new Map<string, MomentView[]>()
  const byPlan = new Map<string, MomentView[]>()
  for (const m of moments) {
    if (m.plan_id) push(byPlan, m.plan_id, m)
    else push(byDay, m.day_id, m)
  }
  return { byDay, byPlan }
}

// 83000 ms -> "1:23"
export const formatDuration = (ms: number): string => {
  const total = Math.max(0, Math.round(ms / 1000))
  const s = total % 60
  return `${Math.floor(total / 60)}:${s < 10 ? '0' : ''}${s}`
}
