import { ChevronDown, ChevronUp, Plus } from 'lucide-react'

import ActivityRow from './activity-row'

import type { Activity, TripDay } from '@/types/trip'
import type { DragEvent } from 'react'

interface DayCardProps {
  day: TripDay
  dayIdx: number
  isExpanded: boolean
  dragOver: { dayId: string; index: number } | null
  onToggle: () => void
  onUpdateTitle: (title: string) => void
  onAddActivity: () => void
  onUpdateActivity: (actId: string, field: keyof Activity, value: string) => void
  onRemoveActivity: (actId: string) => void
  onMoveActivity: (aIdx: number, dir: 'up' | 'down') => void
  onDragStart: (aIdx: number) => void
  onDragOver: (e: DragEvent<HTMLDivElement>, aIdx: number) => void
  onDrop: (aIdx: number) => void
  onDragEnd: () => void
}

export default function DayCard({
  day,
  dayIdx,
  isExpanded,
  dragOver,
  onToggle,
  onUpdateTitle,
  onAddActivity,
  onUpdateActivity,
  onRemoveActivity,
  onMoveActivity,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: DayCardProps) {
  return (
    <div className="bg-white dark:bg-[#2c2c36] rounded-2xl shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.45)] border border-gray-200 dark:border-[#3c3c4a] overflow-hidden">
      <div
        className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#363640] transition-colors"
        onClick={onToggle}
      >
        <span className="text-xs font-semibold text-[#0163a4] dark:text-[#5fb3f5] bg-[#edf3f7] dark:bg-[#1f2e42] rounded-md px-2 py-0.5 flex-shrink-0">
          Day {dayIdx + 1}
        </span>
        <input
          type="text"
          value={day.title}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100 bg-transparent outline-none border-b border-transparent focus:border-gray-300 dark:focus:border-[#3c3c4a] transition-colors"
          placeholder="Day title..."
        />
        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">{day.date}</span>
        {isExpanded ? (
          <ChevronUp size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
        )}
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-[#3c3c4a] px-5 py-4">
          {day.activities.length === 0 && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2 mb-3">
              No activities yet. Add one below.
            </p>
          )}

          <div className="space-y-2">
            {day.activities.map((act, aIdx) => (
              <ActivityRow
                key={act.id}
                act={act}
                aIdx={aIdx}
                totalActivities={day.activities.length}
                isOver={dragOver?.dayId === day.id && dragOver?.index === aIdx}
                onDragStart={() => onDragStart(aIdx)}
                onDragOver={(e) => onDragOver(e, aIdx)}
                onDrop={() => onDrop(aIdx)}
                onDragEnd={onDragEnd}
                onUpdate={(field, value) => onUpdateActivity(act.id, field, value)}
                onRemove={() => onRemoveActivity(act.id)}
                onMove={(dir) => onMoveActivity(aIdx, dir)}
              />
            ))}
          </div>

          <button
            onClick={onAddActivity}
            className="flex items-center gap-1.5 text-sm text-[#0163a4] dark:text-[#5fb3f5] hover:text-[#0470b9] dark:hover:text-[#6ab8f5] font-medium mt-3 transition-colors"
          >
            <Plus size={15} />
            Add Activity
          </button>
        </div>
      )}
    </div>
  )
}
