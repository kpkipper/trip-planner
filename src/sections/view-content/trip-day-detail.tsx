import { safeHttpUrl } from '@/lib/safe-url'
import MomentsGallery from '@/sections/moments/moments-gallery'

import ActivityItem from './activity-item'

import type { MomentView } from '@/api/moments/type'
import type { TripDay, TripSettings } from '@/types/trip'

export interface DayMoments {
  slug: string
  role: string | undefined
  settings: TripSettings | undefined
  dayMoments: MomentView[]
  planMoments: Map<string, MomentView[]>
  reload: () => void
  onMediaError: () => void
}

interface Props {
  day: TripDay
  dayIndex: number
  isCurrentActivity: (actIdx: number) => boolean
  livePlanIds?: Set<string>
  moments?: DayMoments
}

export default function TripDayDetail({
  day,
  dayIndex,
  isCurrentActivity,
  livePlanIds,
  moments,
}: Props) {
  let placeCount = 0

  return (
    <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-center gap-4">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#0163a4] text-2xl font-bold text-white">
          {dayIndex + 1}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">
            Day {dayIndex + 1} · {day.date}
          </p>
          <h2 className="text-2xl font-bold text-gray-900">{day.title}</h2>
        </div>
      </div>

      {moments && (
        <div className="mb-4">
          <MomentsGallery
            slug={moments.slug}
            dayId={day.id}
            moments={moments.dayMoments}
            role={moments.role}
            settings={moments.settings}
            reload={moments.reload}
            onMediaError={moments.onMediaError}
          />
        </div>
      )}

      {day.activities.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400">
          No activities for this day yet.
        </div>
      ) : (
        <ul className="relative before:absolute before:top-4 before:bottom-4 before:left-[86px] before:w-0.5 before:bg-[#0163a4]/20">
          {day.activities.map((act, idx) => (
            <ActivityItem
              key={act.id}
              act={act}
              highlight={isCurrentActivity(idx)}
              today={!!livePlanIds?.has(act.id)}
              placeNumber={safeHttpUrl(act.mapUrl) ? ++placeCount : undefined}
            >
              {moments && (
                <MomentsGallery
                  slug={moments.slug}
                  dayId={day.id}
                  planId={act.id}
                  moments={moments.planMoments.get(act.id) ?? []}
                  role={moments.role}
                  settings={moments.settings}
                  reload={moments.reload}
                  onMediaError={moments.onMediaError}
                />
              )}
            </ActivityItem>
          ))}
        </ul>
      )}
    </div>
  )
}
