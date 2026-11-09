import { ArrowUpRight } from 'lucide-react'

import { safeHttpUrl } from '@/lib/safe-url'

import type { Activity } from '@/types/trip'
import type { ReactNode } from 'react'

interface ActivityItemProps {
  act: Activity
  highlight: boolean
  // Part of today's live plans on the trip owner's day: a subtle marker only.
  today?: boolean
  placeNumber?: number
  // Rendered under the description (the plan's moments).
  children?: ReactNode
}

export default function ActivityItem({
  act,
  highlight,
  today,
  placeNumber,
  children,
}: ActivityItemProps) {
  const mapHref = safeHttpUrl(act.mapUrl)

  return (
    <li className="relative flex gap-4 py-3">
      <span
        className={`w-14 shrink-0 text-right font-mono tabular-nums transition-all ${
          highlight ? 'text-base font-bold text-[#0163a4]' : 'pt-0.5 text-sm text-gray-500'
        }`}
      >
        {act.time}
      </span>

      <span className="relative z-10 flex w-7 shrink-0 justify-center pt-0.5">
        {highlight ? (
          <span className="h-7 w-7 rounded-full border-4 border-[#0163a4] bg-white ring-4 ring-[#0163a4]/15" />
        ) : placeNumber ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0163a4] text-xs font-semibold text-white">
            {placeNumber}
          </span>
        ) : (
          <span className="mt-1 h-3.5 w-3.5 rounded-full border-2 border-[#0163a4] bg-white" />
        )}
      </span>

      <div
        className={`min-w-0 flex-1 transition-all ${
          today && !highlight ? 'border-l-2 border-green-500 pl-2' : ''
        } ${highlight ? 'text-lg font-bold text-gray-900' : 'font-medium text-gray-800'}`}
      >
        {today && !highlight && (
          <span className="mr-2 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-green-700 align-middle">
            Today
          </span>
        )}
        {act.description}
        {mapHref && (
          <a
            href={mapHref}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 inline-flex items-center gap-0.5 text-sm font-normal text-[#0470b9] underline underline-offset-2 hover:text-[#0163a4]"
          >
            Map
            <ArrowUpRight size={14} />
          </a>
        )}
        {children && <div className="mt-1 text-base font-normal">{children}</div>}
      </div>
    </li>
  )
}
