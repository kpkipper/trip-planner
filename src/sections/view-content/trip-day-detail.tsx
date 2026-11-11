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
    <div>
      <div className="mb-5 min-w-0">
        <p className="text-sm font-medium leading-normal text-muted">
          Day {dayIndex + 1} · {day.date}
        </p>
        <h2 className="break-words text-2xl font-semibold leading-snug tracking-tight text-ink">
          {day.title}
        </h2>
      </div>

      {moments && (
        <div className="mb-6">
          <MomentsGallery
            key={day.id}
            stories
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
        <div className="rounded-tile bg-bg py-8 text-center text-sm leading-normal text-muted">
          No activities for this day yet.
        </div>
      ) : (
        <ul className="ml-2 space-y-3 border-l-2 border-dashed border-muted/35 pl-7">
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
