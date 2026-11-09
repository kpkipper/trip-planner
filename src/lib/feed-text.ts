import type { FeedItem } from '@/api/feed/type'

export interface FeedPart {
  text: string
  strong?: boolean
  href?: string
}

const MONTHS = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.',
]
const MAX_COMPANIONS = 3

// API dates are ISO strings at T00:00:00Z: the UTC calendar date is the trip date.
const parseUtc = (iso: string | undefined): Date | null => {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

export const formatThaiDateRange = (start?: string, end?: string): string => {
  const a = parseUtc(start)
  const b = parseUtc(end)
  if (!a) return ''
  if (!b) return `${a.getUTCDate()} ${MONTHS[a.getUTCMonth()]}`
  const [ad, am, ay] = [a.getUTCDate(), a.getUTCMonth(), a.getUTCFullYear()]
  const [bd, bm, by] = [b.getUTCDate(), b.getUTCMonth(), b.getUTCFullYear()]
  if (ay !== by) return `${ad} ${MONTHS[am]} ${ay} – ${bd} ${MONTHS[bm]} ${by}`
  if (am !== bm) return `${ad} ${MONTHS[am]} – ${bd} ${MONTHS[bm]}`
  if (ad === bd) return `${ad} ${MONTHS[am]}`
  return `${ad}–${bd} ${MONTHS[am]}`
}

const displayName = (p: { username: string; display_name: string }) => p.display_name || p.username

const userHref = (username: string) => `/u/${encodeURIComponent(username)}`
const tripHref = (slug: string) => `/plans/${encodeURIComponent(slug)}`

export const feedText = (item: FeedItem): { parts: FeedPart[] } => {
  const actor: FeedPart = {
    text: displayName(item.actor),
    strong: true,
    href: userHref(item.actor.username),
  }
  const dest: FeedPart = {
    text: item.trip.destination,
    strong: true,
    href: tripHref(item.trip.slug),
  }
  switch (item.type) {
    case 'trip_planned': {
      const parts: FeedPart[] = [actor, { text: ' กำลังจะไป ' }, dest]
      const names = item.companions.slice(0, MAX_COMPANIONS).map(displayName)
      if (names.length > 0) {
        const extra = item.companions.length - names.length
        parts.push({ text: ` กับ ${names.join(', ')}${extra > 0 ? ` และอีก ${extra} คน` : ''}` })
      }
      const range = formatThaiDateRange(item.trip.departure_date, item.trip.return_date)
      if (range) parts.push({ text: ` · ${range}` })
      return { parts }
    }
    case 'trip_started':
      return { parts: [actor, { text: ' เริ่มทริป ' }, dest, { text: ' แล้ว 🟢' }] }
    case 'moments_added': {
      const m = item.moments
      return {
        parts: [actor, { text: m ? ` แปะ ${m.count} รูปใน ${m.day_title}` : ' แปะรูป' }],
      }
    }
    case 'trip_completed':
      return { parts: [actor, { text: ' เที่ยว ' }, dest, { text: ' จบแล้ว ✅' }] }
  }
}

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export const relativeThai = (iso: string, now: Date = new Date()): string => {
  const at = parseUtc(iso)
  if (!at) return ''
  const diff = now.getTime() - at.getTime()
  if (diff < MIN) return 'เมื่อสักครู่'
  if (diff < HOUR) return `${Math.floor(diff / MIN)} นาทีที่แล้ว`
  if (diff < DAY) return `${Math.floor(diff / HOUR)} ชม.ที่แล้ว`
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)} วันที่แล้ว`
  const day = `${at.getUTCDate()} ${MONTHS[at.getUTCMonth()]}`
  return at.getUTCFullYear() === now.getUTCFullYear() ? day : `${day} ${at.getUTCFullYear()}`
}
