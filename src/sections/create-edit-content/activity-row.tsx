import { ArrowDown, ArrowUp, GripVertical, MapPin, Trash2 } from 'lucide-react'

import { EmojiButton, TimeAutocomplete } from './helper'

import type { Activity } from '@/types/trip'
import type { DragEvent } from 'react'

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
      className={`rounded-xl border border-gray-200 dark:border-[#3c3c4a] bg-gray-50 dark:bg-[#313139] p-2.5 space-y-2 transition-colors ${
        isOver ? 'ring-1 ring-indigo-200 dark:ring-indigo-800 bg-indigo-50 dark:bg-indigo-900/20' : ''
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="hidden sm:inline-flex cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 touch-none flex-shrink-0">
          <GripVertical size={16} />
        </span>
        <EmojiButton value={act.emoji ?? ''} onChange={(v) => onUpdate('emoji', v)} />
        <TimeAutocomplete value={act.time} onChange={(v) => onUpdate('time', v)} />
        <div className="flex-1" />
        <button
          onClick={() => onMove('up')}
          disabled={aIdx === 0}
          className="sm:hidden p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#3c3c4a] text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
        >
          <ArrowUp size={14} />
        </button>
        <button
          onClick={() => onMove('down')}
          disabled={aIdx === totalActivities - 1}
          className="sm:hidden p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#3c3c4a] text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
        >
          <ArrowDown size={14} />
        </button>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
        >
          <Trash2 size={15} />
        </button>
      </div>
      <input
        type="text"
        value={act.description}
        onChange={(e) => onUpdate('description', e.target.value)}
        placeholder="What are you doing?"
        className="w-full border border-gray-300 dark:border-[#3c3c4a] rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition bg-white dark:bg-[#1a1a22] dark:text-gray-100 dark:placeholder-gray-500"
      />
      <div className="flex items-center gap-1.5">
        <MapPin size={13} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          value={act.mapUrl ?? ''}
          onChange={(e) => onUpdate('mapUrl', e.target.value)}
          placeholder="Maps URL (optional)"
          className="flex-1 border border-gray-300 dark:border-[#3c3c4a] rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition bg-white dark:bg-[#1a1a22] dark:text-gray-100 dark:placeholder-gray-500"
        />
      </div>
    </div>
  )
}
