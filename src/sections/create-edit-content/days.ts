import { MAX_TRIP_DAYS } from '@/lib/date-range'

import type { TripDay } from '@/types/trip'

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

const pad = (n: number) => String(n).padStart(2, '0')

// YYYY-MM-DD from local calendar parts (toISOString would shift the date in UTC+ zones).
const toDateISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

const localNoon = (dateISO: string) => {
  const [y, m, d] = dateISO.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

function formatDateDisplay(dateISO: string): string {
  return localNoon(dateISO).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })
}

// One entry per date in range (max MAX_TRIP_DAYS). Every existing day on an in-range date is kept,
// including several days that share a date, so a loaded server day is never dropped
// (dropping it would delete it and its plans on save). Duplicates by id are kept once.
export function generateDays(startDate: string, endDate: string, existing: TripDay[]): TripDay[] {
  const days: TripDay[] = []
  const seen = new Set<string>()
  const end = localNoon(endDate)
  const cur = localNoon(startDate)
  let i = 0
  while (cur <= end && i < MAX_TRIP_DAYS) {
    const dateISO = toDateISO(cur)
    const matches = existing.filter((d) => d.dateISO === dateISO && !seen.has(d.id))
    if (matches.length === 0) {
      const dateDisplay = formatDateDisplay(dateISO)
      days.push({ id: uid(), date: dateDisplay, dateISO, title: dateDisplay, activities: [] })
    }
    for (const d of matches) {
      if (seen.has(d.id)) continue
      seen.add(d.id)
      days.push(d)
    }
    cur.setDate(cur.getDate() + 1)
    i++
  }
  return days
}
