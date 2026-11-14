// Pure rules for the trip date range picker. Dates are calendar dates as YYYY-MM-DD
// strings; all arithmetic runs in UTC so local daylight saving can never shift a day.

/** Longest trip the form can hold (generateDays makes one day per date, up to this many). */
export const MAX_TRIP_DAYS = 60

export interface DateRange {
  start: string // '' = not picked
  end: string // '' = not picked
}

export interface MonthRef {
  year: number
  month: number // 0-11
}

export type CellState = 'none' | 'start' | 'end' | 'single' | 'between'

const DAY_MS = 86_400_000
const pad = (n: number) => String(n).padStart(2, '0')

const toUTC = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

const fromUTC = (ms: number) => {
  const d = new Date(ms)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

export const addDays = (iso: string, n: number) => fromUTC(toUTC(iso) + n * DAY_MS)

/** Days from start to end, both included. */
export const dayCount = (start: string, end: string) =>
  Math.round((toUTC(end) - toUTC(start)) / DAY_MS) + 1

export const todayISO = (now = new Date()) =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

export const monthOf = (iso: string): MonthRef => {
  const [y, m] = iso.split('-').map(Number)
  return { year: y, month: m - 1 }
}

/** Same day `n` months later, clamped to that month's length (31 Mar + 1 → 30 Apr). */
export function addMonthsClamped(iso: string, n: number): string {
  const m = shiftMonth(monthOf(iso), n)
  const last = new Date(Date.UTC(m.year, m.month + 1, 0)).getUTCDate()
  const day = Math.min(Number(iso.slice(8, 10)), last)
  return `${m.year}-${pad(m.month + 1)}-${pad(day)}`
}

export const shiftMonth = ({ year, month }: MonthRef, n: number): MonthRef => {
  const total = year * 12 + month + n
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 }
}

/** Six weeks (Sunday first) of one month, so every month is the same height; cells outside the month are null. */
export function monthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(Date.UTC(year, month, 1)).getUTCDay()
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells: (string | null)[] = Array(first).fill(null)
  for (let d = 1; d <= days; d++) cells.push(`${year}-${pad(month + 1)}-${pad(d)}`)
  while (cells.length < 42) cells.push(null)
  const weeks: (string | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

// Fixed English names, so labels never depend on the browser's ICU data.
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const monthTitle = (year: number, month: number) => `${MONTHS[month]} ${year}`

const parts = (iso: string) => {
  const d = new Date(toUTC(iso))
  return {
    wd: DAYS[d.getUTCDay()],
    day: d.getUTCDate(),
    mon: MONTHS[d.getUTCMonth()],
    year: d.getUTCFullYear(),
  }
}

/** "Sat, 14 Nov" */
export const formatDateShort = (iso: string) => {
  if (!iso) return ''
  const p = parts(iso)
  return `${p.wd.slice(0, 3)}, ${p.day} ${p.mon.slice(0, 3)}`
}

/** "Saturday, 14 November 2026" (for screen readers) */
export const formatDateLong = (iso: string) => {
  if (!iso) return ''
  const p = parts(iso)
  return `${p.wd}, ${p.day} ${p.mon} ${p.year}`
}

/** Two-letter weekday headings (plus full names), Sunday first. */
export const WEEKDAYS = DAYS.map((d) => ({ short: d.slice(0, 2), long: d }))

/**
 * Applies one tap on `date`. The first tap picks the start; the next tap on or after it
 * picks the end (`done`). A tap before the start, past the length limit, or after a
 * complete range starts over from that date.
 */
export function pickDate(range: DateRange, date: string): DateRange & { done: boolean } {
  const choosingEnd = range.start !== '' && range.end === ''
  if (choosingEnd && date >= range.start && !isOutOfRange(date, range)) {
    return { start: range.start, end: date, done: true }
  }
  return { start: date, end: '', done: false }
}

/** True for dates that would make the trip longer than MAX_TRIP_DAYS while the end is being picked. */
export const isOutOfRange = (date: string, range: DateRange) =>
  range.start !== '' &&
  range.end === '' &&
  date > range.start &&
  dayCount(range.start, date) > MAX_TRIP_DAYS

/** How a day cell is drawn; `hover` previews the range while the end is being picked. */
export function cellState(date: string, range: DateRange, hover?: string): CellState {
  const { start } = range
  if (!start) return 'none'
  let end = range.end
  if (!end && hover && hover > start && !isOutOfRange(hover, range)) end = hover
  if (!end || end === start) return date === start ? 'single' : 'none'
  if (date === start) return 'start'
  if (date === end) return 'end'
  return date > start && date < end ? 'between' : 'none'
}

/** "3 nights · 4 days", "Day trip · 1 day", or '' when the range is incomplete. */
export function rangeSummary(start: string, end: string): string {
  if (!start || !end || end < start) return ''
  const days = dayCount(start, end)
  const nights = days - 1
  if (nights === 0) return 'Day trip · 1 day'
  return `${nights} ${nights === 1 ? 'night' : 'nights'} · ${days} days`
}
