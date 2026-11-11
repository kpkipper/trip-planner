import { ArrowDown, ArrowUp, GripVertical, MapPin, Trash2 } from 'lucide-react'

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
      className={`rounded-xl border border-gray-200 bg-gray-50 p-2.5 space-y-2 transition-colors ${
        isOver ? 'ring-1 ring-accent/40 bg-accent-soft' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-flex cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none flex-shrink-0">
          <GripVertical size={16} />
        </span>
        <TimeAutocomplete value={act.time} onChange={(v) => onUpdate('time', v)} />
        <select
          value={act.category ?? ''}
          onChange={(e) => onUpdate('category', e.target.value)}
          aria-label="Category"
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-gray-700 bg-white outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
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
          className="sm:hidden p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
        >
          <ArrowUp size={14} />
        </button>
        <button
          onClick={() => onMove('down')}
          disabled={aIdx === totalActivities - 1}
          className="sm:hidden p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
        >
          <ArrowDown size={14} />
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
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
        className={`w-full border ${descriptionError ? 'border-red-400' : 'border-gray-300'} rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition`}
      />
      {descriptionError && <p className="text-xs text-red-500">{descriptionError}</p>}
      <div className="flex items-center gap-1.5">
        <MapPin size={13} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={act.mapUrl ?? ''}
          onChange={(e) => onUpdate('mapUrl', e.target.value)}
          placeholder="Maps URL (optional)"
          aria-invalid={!!mapUrlError}
          className={`flex-1 border ${mapUrlError ? 'border-red-400' : 'border-gray-300'} rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition`}
        />
      </div>
      {mapUrlError && <p className="text-xs text-red-500">{mapUrlError}</p>}
    </div>
  )
}
