import type { DragEvent } from 'react'
import { GripVertical, ArrowUp, ArrowDown, Trash2, MapPin } from 'lucide-react'
import type { Activity } from '@/types/trip'
import { EmojiButton, TimeAutocomplete } from './helper'

interface ActivityRowProps {
  act: Activity
  aIdx: number
  totalActivities: number
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
        isOver ? 'ring-1 ring-indigo-200 bg-indigo-50' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-flex cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none flex-shrink-0">
          <GripVertical size={16} />
        </span>
        <EmojiButton
          value={act.emoji ?? ''}
          onChange={(v) => onUpdate('emoji', v)}
        />
        <TimeAutocomplete
          value={act.time}
          onChange={(v) => onUpdate('time', v)}
        />
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
        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition"
      />
      <div className="flex items-center gap-1.5">
        <MapPin size={13} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={act.mapUrl ?? ''}
          onChange={(e) => onUpdate('mapUrl', e.target.value)}
          placeholder="Maps URL (optional)"
          className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition"
        />
      </div>
    </div>
  )
}
