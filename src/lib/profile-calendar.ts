export interface CalendarEntry {
  slug: string
  title: string
  destination: string
  country: string
  departure_date?: string | null
  return_date?: string | null
  month_start?: string
  month_end?: string
}

export interface CalendarMonth<T> {
  month: number // 1-12
  items: T[]
}

export interface CalendarYear<T> {
  year: number
  months: CalendarMonth<T>[]
}

export interface GroupedCalendar<T> {
  years: CalendarYear<T>[]
  hidden: T[]
}

const DATE = /^(\d{4})-(\d{2})-\d{2}/

// Groups by the departure date as written (no timezone conversion). Items without a usable
// date go to `hidden`: dates are never inferred (not even from month_start/month_end).
export function groupCalendar<T extends Pick<CalendarEntry, 'departure_date'>>(
  items: T[] | null | undefined,
): GroupedCalendar<T> {
  const dated: Array<{ item: T; date: string; year: number; month: number }> = []
  const hidden: T[] = []
  for (const item of items ?? []) {
    const m = DATE.exec(item.departure_date ?? '')
    const month = m ? Number(m[2]) : 0
    if (m && month >= 1 && month <= 12) {
      dated.push({
        item,
        date: (item.departure_date as string).slice(0, 10),
        year: Number(m[1]),
        month,
      })
    } else {
      hidden.push(item)
    }
  }
  dated.sort((a, b) => a.date.localeCompare(b.date))
  const years: CalendarYear<T>[] = []
  for (const d of dated) {
    let year = years[years.length - 1]
    if (!year || year.year !== d.year) years.push((year = { year: d.year, months: [] }))
    let month = year.months[year.months.length - 1]
    if (!month || month.month !== d.month) year.months.push((month = { month: d.month, items: [] }))
    month.items.push(d.item)
  }
  return { years, hidden }
}
