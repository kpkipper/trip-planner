import { MapPin } from 'lucide-react'

import type { Activity } from '@/types/trip'

interface ActivityItemProps {
  act: Activity
  highlight: boolean
}

export default function ActivityItem({ act, highlight }: ActivityItemProps) {
  return (
    <li
      className={`flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-indigo-50 dark:hover:bg-[#252535] transition ${
        highlight
          ? 'bg-yellow-100 dark:bg-yellow-900/25 font-medium text-indigo-800 dark:text-yellow-200'
          : 'bg-white dark:bg-[#2c2c36]'
      }`}
      onClick={() => act.mapUrl && window.open(act.mapUrl, '_blank')}
    >
      <span className="flex items-center gap-2 dark:text-gray-200">
        <span className="text-xl">{act.emoji || '📍'}</span>
        <span>{`${act.time ? act.time + ': ' : ''}${act.description}`}</span>
      </span>
      {act.mapUrl && <MapPin size={14} className="text-gray-400 flex-shrink-0" />}
    </li>
  )
}
