import { ChevronDown, ChevronUp, Plus } from 'lucide-react'

import { buttonClass, cn } from '@/lib/ui-classes'

import ActivityRow from './activity-row'
import { activityErrorKey } from './sync'

import type { Activity, TripDay } from '@/types/trip'
import type { DragEvent } from 'react'

interface DayCardProps {
  day: TripDay
  dayIdx: number
  isExpanded: boolean
  dragOver: { dayId: string; index: number } | null
  errors: Record<string, string>
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
  errors,
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
    // No overflow-hidden: it would clip the time suggestions of the last activity. The header
    // rounds its own corners for the hover fill instead.
    <div className="rounded-card bg-surface shadow-soft">
      <div
        className={cn(
          'flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-bg sm:px-5',
          isExpanded ? 'rounded-t-card' : 'rounded-card',
        )}
        onClick={onToggle}
      >
        <span className="text-xs font-semibold leading-normal text-ink-2 bg-chip rounded-full px-2.5 py-0.5 flex-shrink-0">
          Day {dayIdx + 1}
        </span>
        <input
          type="text"
          value={day.title}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="min-w-0 flex-1 rounded-tile bg-transparent px-2 py-1 text-sm font-medium leading-normal text-ink outline-none transition-colors placeholder:text-muted focus:bg-chip focus:ring-2 focus:ring-accent"
          placeholder="Day title..."
        />
        <span className="flex-shrink-0 text-xs leading-normal text-muted">{day.date}</span>
        {isExpanded ? (
          <ChevronUp size={16} className="flex-shrink-0 text-muted" />
        ) : (
          <ChevronDown size={16} className="flex-shrink-0 text-muted" />
        )}
      </div>

      {isExpanded && (
        <div className="border-t border-line px-4 py-4 sm:px-5">
          {day.activities.length === 0 && (
            <p className="mb-3 py-2 text-center text-sm leading-normal text-muted">
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
                descriptionError={errors[activityErrorKey(act.id, 'description')]}
                mapUrlError={errors[activityErrorKey(act.id, 'mapUrl')]}
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
            className={cn(buttonClass('secondary', 'sm'), 'mt-3')}
          >
            <Plus size={15} />
            Add Activity
          </button>
        </div>
      )}
    </div>
  )
}
