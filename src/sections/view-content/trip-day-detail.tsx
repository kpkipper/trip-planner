import ActivityItem from './activity-item'

import type { TripDay } from '@/types/trip'

interface Props {
  day: TripDay
  dayIndex: number
  isCurrentActivity: (actIdx: number) => boolean
}

export default function TripDayDetail({ day, dayIndex, isCurrentActivity }: Props) {
  return (
    <div className="mb-6 rounded-2xl shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.55)] border border-gray-200 dark:border-[#3c3c4a] overflow-hidden">
      <div className="bg-gradient-to-b from-[#edf3f7] dark:from-[#1f2e42] dark:to-[#2c2c36] to-70% px-6 py-4">
        <h2 className="text-lg font-semibold text-[#0163a4] dark:text-[#5fb3f5]">
          Day {dayIndex + 1}: {day.title}
        </h2>
        <p className="text-[#0470b9] dark:text-[#5fb3f5] font-semibold inline-block px-4 py-1.5 rounded-md w-fit text-base shadow-sm mt-1 bg-[#0470b91a] dark:bg-[#5fb3f51a]">
          {day.date}
        </p>
      </div>

      {day.activities.length === 0 ? (
        <div className="px-6 py-8 text-center text-gray-400 text-sm bg-white dark:bg-[#2c2c36]">
          No activities for this day yet.
        </div>
      ) : (
        <ul className="divide-y divide-gray-200 dark:divide-[#3c3c4a]">
          {day.activities.map((act, idx) => (
            <ActivityItem key={act.id} act={act} highlight={isCurrentActivity(idx)} />
          ))}
        </ul>
      )}
    </div>
  )
}
