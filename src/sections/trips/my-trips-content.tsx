'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { CloudOff, Plus, RotateCw } from 'lucide-react'

import { SkeletonBlock, TripGridSkeleton } from '@/components/page-loading'
import TripCard from '@/components/trip-card'
import { Button, ButtonLink } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useTrips } from '@/contexts/trips-context'
import { myTripsView } from '@/lib/my-trips-view'
import { loginPath } from '@/lib/safe-next'

import type { Trip } from '@/types/trip'

function TripGrid({ trips }: { trips: Trip[] }) {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => (
        <li key={trip.slug ?? trip.id} className="min-w-0">
          <TripCard trip={trip} />
        </li>
      ))}
    </ul>
  )
}

function CreatePlanButton() {
  return (
    <ButtonLink href="/plans/create" variant="secondary">
      <Plus size={16} className="flex-shrink-0" />
      Create Plan
    </ButtonLink>
  )
}

export default function MyTripsContent() {
  const router = useRouter()
  const { status } = useAuth()
  const { myTrips, sharedTrips, loaded, error, reload } = useTrips()

  useEffect(() => {
    if (status === 'anon') router.replace(loginPath('/trips'))
  }, [status, router])

  const empty = myTrips.length === 0 && sharedTrips.length === 0
  const view = myTripsView({ authed: status === 'authed', loaded, error, empty })
  if (view === 'loading') {
    return (
      <div className="px-4 py-8">
        <SkeletonBlock className="mb-6 h-10 w-40 md:h-14 md:w-56" />
        <TripGridSkeleton />
      </div>
    )
  }

  return (
    <div className="px-4 py-8">
      <h1 className="mb-6 text-[28px] font-semibold leading-snug tracking-tight text-ink md:text-[40px]">
        My trips
      </h1>

      {view === 'error' ? (
        <div
          role="alert"
          className="flex flex-col items-center gap-4 rounded-card bg-surface px-6 py-16 text-center shadow-soft"
        >
          <CloudOff size={28} className="text-muted" aria-hidden />
          <p className="leading-normal text-muted">Could not load your trips.</p>
          <Button variant="secondary" onClick={reload}>
            <RotateCw size={16} className="flex-shrink-0" />
            Try again
          </Button>
        </div>
      ) : view === 'empty' ? (
        <div className="flex flex-col items-center gap-4 rounded-card bg-surface px-6 py-16 text-center shadow-soft">
          <p className="leading-normal text-muted">ยังไม่มีทริป เริ่มวางแผนทริปแรกกันเลย</p>
          <CreatePlanButton />
        </div>
      ) : (
        <>
          {myTrips.length > 0 ? (
            <TripGrid trips={myTrips} />
          ) : (
            <div className="flex flex-col items-start gap-3 rounded-card bg-surface p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <p className="leading-normal text-muted">ยังไม่มีทริปที่คุณสร้าง</p>
              <CreatePlanButton />
            </div>
          )}

          {sharedTrips.length > 0 && (
            <section aria-labelledby="shared-trips" className="mt-10">
              <h2
                id="shared-trips"
                className="mb-4 text-xl font-semibold leading-normal tracking-tight text-ink"
              >
                Shared with me
              </h2>
              <TripGrid trips={sharedTrips} />
            </section>
          )}
        </>
      )}
    </div>
  )
}
