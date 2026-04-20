import type { DragEvent } from 'react'
import { ChevronDown, ChevronUp, Plus } from 'lucide-react'
import type { Activity, TripDay } from '@/types/trip'
import ActivityRow from './activity-row'

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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div
        className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <span className="text-xs font-semibold text-[#0163a4] bg-[#edf3f7] rounded-md px-2 py-0.5 flex-shrink-0">
          Day {dayIdx + 1}
        </span>
        <input
          type="text"
          value={day.title}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="flex-1 text-sm font-medium text-gray-800 bg-transparent outline-none border-b border-transparent focus:border-gray-300 transition-colors"
          placeholder="Day title..."
        />
        <span className="text-xs text-gray-400 flex-shrink-0">{day.date}</span>
        {isExpanded ? (
          <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
        )}
      </div>

      {isExpanded && (
        <div className="border-t border-gray-100 px-5 py-4">
          {day.activities.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-2 mb-3">
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
            className="flex items-center gap-1.5 text-sm text-[#0163a4] hover:text-[#0470b9] font-medium mt-3 transition-colors"
          >
            <Plus size={15} />
            Add Activity
          </button>
        </div>
      )}
    </div>
  )
}
