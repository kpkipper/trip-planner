import ActivityItem from './activity-item'

import type { TripDay } from '@/types/trip'

interface Props {
  day: TripDay
  dayIndex: number
  isCurrentActivity: (actIdx: number) => boolean
}

export default function TripDayDetail({ day, dayIndex, isCurrentActivity }: Props) {
  return (
    <div className="mb-6 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-b from-[#edf3f7] to-70% px-6 py-4">
        <h2 className="text-lg font-semibold text-[#0163a4]">
          Day {dayIndex + 1}: {day.title}
        </h2>
        <p className="text-[#0470b9] font-semibold inline-block px-4 py-1.5 rounded-md w-fit text-base shadow-sm mt-1 bg-[#0470b91a]">
          {day.date}
        </p>
      </div>

      {day.activities.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-400 text-sm bg-white">
          No activities for this day yet.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200">
          {day.activities.map((act, idx) => (
            <ActivityItem key={act.id} act={act} highlight={isCurrentActivity(idx)} />
          ))}
        </ul>
      )}
    </div>
  )
}
