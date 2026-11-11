import { StoryRing } from '@/components/ui/story-ring'
import UserAvatar from '@/components/user-avatar'

import type { NowTraveler } from '@/api/feed/type'

const RING = 64

export default function NowRow({ travelers }: { travelers: NowTraveler[] }) {
  if (travelers.length === 0) return null
  return (
    <section aria-label="กำลังเดินทาง" className="mb-6">
      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 pt-1">
        {travelers.map((t) => (
          <a
            key={`${t.user.username}:${t.trip.slug}`}
            href={`/plans/${encodeURIComponent(t.trip.slug)}`}
            className="flex w-24 flex-shrink-0 flex-col items-center gap-1 rounded-tile text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="relative">
              <StoryRing size={RING}>
                <UserAvatar user={t.user} size={RING - 12} />
              </StoryRing>
              {/* Travelling now: a small green live dot. */}
              <span
                aria-hidden
                className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-live ring-2 ring-bg"
              />
            </span>
            <span className="w-full truncate text-xs font-medium leading-normal text-ink">
              {t.user.display_name || t.user.username}
            </span>
            <span className="w-full truncate text-[11px] leading-normal text-muted">
              วันที่ {t.day_number}/{t.total_days} · {t.trip.destination}
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
