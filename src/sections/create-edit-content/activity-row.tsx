import { ArrowDown, ArrowUp, GripVertical, MapPin, Trash2 } from 'lucide-react'

import { cn, fieldClass, fieldErrorClass } from '@/lib/ui-classes'

import { TimeAutocomplete } from './helper'

import type { Activity } from '@/types/trip'
import type { DragEvent } from 'react'

// API plan categories. "stay" plans are hidden from people outside the trip.
const CATEGORY_OPTIONS = [
  { value: '', label: 'No category' },
  { value: 'stay', label: 'Stay (members only)' },
  { value: 'food', label: 'Food' },
  { value: 'sight', label: 'Sight' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' },
]

const iconButton = (extra: string) =>
  cn(
    'grid h-8 w-8 flex-shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-30',
    extra,
  )

interface ActivityRowProps {
  act: Activity
  aIdx: number
  totalActivities: number
  descriptionError?: string
  mapUrlError?: string
  isOver: boolean
  onDragStart: () => void
  onDragOver: (e: DragEvent<HTMLDivElement>) => void
  onDrop: () => void
  onDragEnd: () => void
  onUpdate: (field: keyof Activity, value: string) => void
  onRemove: () => void
  onMove: (dir: 'up' | 'down') => void
}

export default function ActivityRow({
  act,
  aIdx,
  totalActivities,
  descriptionError,
  mapUrlError,
  isOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onUpdate,
  onRemove,
  onMove,
}: ActivityRowProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        'space-y-2 rounded-tile p-3 ring-1 ring-inset transition-colors',
        isOver ? 'bg-accent-soft ring-accent/40' : 'bg-surface ring-line',
      )}
    >
      <div className="flex items-center gap-2">
        <span className="hidden flex-shrink-0 cursor-grab touch-none text-muted/50 hover:text-muted active:cursor-grabbing sm:inline-flex">
          <GripVertical size={16} />
        </span>
        <TimeAutocomplete value={act.time} onChange={(v) => onUpdate('time', v)} />
        <select
          value={act.category ?? ''}
          onChange={(e) => onUpdate('category', e.target.value)}
          aria-label="Category"
          className={cn(fieldClass, 'min-w-0 px-3 py-2')}
        >
          {CATEGORY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={() => onMove('up')}
          disabled={aIdx === 0}
          aria-label="Move up"
          className={iconButton('sm:hidden')}
        >
          <ArrowUp size={14} />
        </button>
        <button
          onClick={() => onMove('down')}
          disabled={aIdx === totalActivities - 1}
          aria-label="Move down"
          className={iconButton('sm:hidden')}
        >
          <ArrowDown size={14} />
        </button>
        <button
          onClick={onRemove}
          aria-label="Remove activity"
          className={iconButton('hover:bg-danger/5 hover:text-danger')}
        >
          <Trash2 size={15} />
        </button>
      </div>
      <input
        type="text"
        value={act.description}
        onChange={(e) => onUpdate('description', e.target.value)}
        placeholder="What are you doing?"
        aria-invalid={!!descriptionError}
        className={cn(fieldClass, 'w-full px-3 py-2', descriptionError && fieldErrorClass)}
      />
      {descriptionError && <p className="text-xs leading-normal text-danger">{descriptionError}</p>}
      <div className="flex items-center gap-1.5">
        <MapPin size={14} className="flex-shrink-0 text-muted" />
        <input
          type="text"
          value={act.mapUrl ?? ''}
          onChange={(e) => onUpdate('mapUrl', e.target.value)}
          placeholder="Maps URL (optional)"
          aria-invalid={!!mapUrlError}
          className={cn(fieldClass, 'min-w-0 flex-1 px-3 py-2', mapUrlError && fieldErrorClass)}
        />
      </div>
      {mapUrlError && <p className="text-xs leading-normal text-danger">{mapUrlError}</p>}
    </div>
  )
}
