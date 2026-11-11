import { MapPin } from 'lucide-react'

import { coverGradient } from '@/lib/cover-gradient'
import { safeHttpsUrl } from '@/lib/safe-url'
import { cardClass, cn } from '@/lib/ui-classes'
import StatusBadge from '@/sections/view-content/status-badge'

import type { Trip } from '@/types/trip'

export type TripCardData = Pick<Trip, 'title' | 'destination'> &
  Partial<Pick<Trip, 'slug' | 'country' | 'coverUrl' | 'status'>>

const place = (destination: string, country?: string) =>
  [destination, country].filter(Boolean).join(', ')

// Trip tile for grids (My trips, profile). A full page load on purpose: trip pages are served
// from a static shell, like every other trip link in the app.
export default function TripCard({ trip, className }: { trip: TripCardData; className?: string }) {
  const cover = safeHttpsUrl(trip.coverUrl)
  const where = place(trip.destination, trip.country)

  return (
    <a
      href={`/plans/${encodeURIComponent(trip.slug ?? '')}`}
      className={cardClass(
        cn(
          'group block overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          className,
        ),
        '',
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-chip">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- static export, remote cover
          <img
            src={cover}
            alt=""
            referrerPolicy="no-referrer"
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <span
            aria-hidden
            className="block h-full w-full"
            style={{ backgroundImage: coverGradient(trip.slug ?? trip.title) }}
          />
        )}
      </div>
      <div className="flex flex-col gap-2 p-4">
        <span className="line-clamp-2 break-words text-base font-semibold leading-normal tracking-tight text-ink">
          {trip.title}
        </span>
        {where && (
          <span className="flex min-w-0 items-center gap-1 text-sm leading-normal text-muted">
            <MapPin size={14} className="flex-shrink-0" />
            <span className="truncate">{where}</span>
          </span>
        )}
        {trip.status && (
          <span>
            <StatusBadge status={trip.status} />
          </span>
        )}
      </div>
    </a>
  )
}

/** Grid of trip cards used by /trips and the profile tabs (TripGridSkeleton matches it). */
export function TripGrid({ trips }: { trips: TripCardData[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip, i) => (
        <li key={trip.slug ?? `${trip.title}-${i}`} className="min-w-0">
          <TripCard trip={trip} />
        </li>
      ))}
    </ul>
  )
}
