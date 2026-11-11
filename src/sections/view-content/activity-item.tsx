import { ArrowUpRight } from 'lucide-react'

import { safeHttpUrl } from '@/lib/safe-url'
import { cn } from '@/lib/ui-classes'

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

// One stop on the day timeline. The parent <ul> draws the dashed line (border-l-2 + pl-7), so
// the marker sits 29px left of this tile's edge, centred on that line.
export default function ActivityItem({
  act,
  highlight,
  today,
  placeNumber,
  children,
}: ActivityItemProps) {
  const mapHref = safeHttpUrl(act.mapUrl)

  return (
    <li
      className={cn(
        'relative rounded-tile bg-bg p-3.5 transition-shadow',
        highlight && 'bg-surface shadow-soft ring-2 ring-primary',
      )}
    >
      {highlight ? (
        <span
          aria-hidden
          className="absolute top-[18px] -left-[37px] h-4 w-4 rounded-full border-4 border-primary bg-surface ring-4 ring-primary/10"
        />
      ) : placeNumber ? (
        <span
          aria-hidden
          className="absolute top-4 -left-[39px] flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold leading-none text-white"
        >
          {placeNumber}
        </span>
      ) : (
        <span
          aria-hidden
          className="absolute top-5 -left-[35px] h-3 w-3 rounded-full border-[3px] border-primary bg-surface"
        />
      )}

      <div className="flex items-start gap-3">
        <div
          className={cn(
            'min-w-0 flex-1 break-words leading-normal text-ink',
            highlight ? 'text-lg font-semibold' : 'font-medium',
          )}
        >
          {today && !highlight && (
            <span className="mr-2 inline-flex items-center gap-1 rounded-full bg-live/10 px-2 py-0.5 align-middle text-[11px] font-semibold uppercase leading-normal text-live">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-live" />
              Today
            </span>
          )}
          {act.description}
          {mapHref && (
            <a
              href={mapHref}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-0.5 rounded text-sm font-normal text-accent underline underline-offset-2 hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Map
              <ArrowUpRight size={14} />
            </a>
          )}
        </div>
        {act.time && (
          <span
            className={cn(
              'shrink-0 rounded-full px-2.5 py-1 text-[13px] font-semibold tabular-nums leading-normal',
              highlight ? 'bg-primary text-white' : 'bg-surface text-ink-2',
            )}
          >
            {act.time}
          </span>
        )}
      </div>
      {children && <div className="mt-2 text-base font-normal">{children}</div>}
    </li>
  )
}
