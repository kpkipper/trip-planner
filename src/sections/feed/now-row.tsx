import UserAvatar from '@/components/user-avatar'

import type { NowTraveler } from '@/api/feed/type'

export default function NowRow({ travelers }: { travelers: NowTraveler[] }) {
  if (travelers.length === 0) return null
  return (
    <section aria-label="กำลังเดินทาง" className="mb-4">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {travelers.map((t) => (
          <a
            key={`${t.user.username}:${t.trip.slug}`}
            href={`/plans/${encodeURIComponent(t.trip.slug)}`}
            className="flex flex-col items-center gap-1 flex-shrink-0 w-24 text-center"
          >
            <span className="rounded-full p-0.5 ring-2 ring-green-500">
              <UserAvatar user={t.user} size={52} />
            </span>
            <span className="text-xs font-medium text-gray-800 truncate w-full">
              {t.user.display_name || t.user.username}
            </span>
            <span className="text-[11px] text-gray-500 truncate w-full">
              วันที่ {t.day_number}/{t.total_days} · {t.trip.destination}
            </span>
          </a>
        ))}
      </div>
    </section>
  )
}
