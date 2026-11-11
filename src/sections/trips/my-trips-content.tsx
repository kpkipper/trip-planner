'use client'

import { CloudOff, LogIn, Plus, RotateCw } from 'lucide-react'

import { SkeletonBlock, TripGridSkeleton } from '@/components/page-loading'
import { TripGrid } from '@/components/trip-card'
import { Button, ButtonLink } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useTrips } from '@/contexts/trips-context'
import { myTripsView } from '@/lib/my-trips-view'
import { loginPath } from '@/lib/safe-next'

function CreatePlanButton() {
  return (
    <ButtonLink href="/plans/create" variant="secondary">
      <Plus size={16} className="flex-shrink-0" />
      Create Plan
    </ButtonLink>
  )
}

const emptyCardClass =
  'flex flex-col items-center gap-4 rounded-card bg-surface px-6 py-16 text-center shadow-soft'

// Logged in: "My trips" (own trips, then "Shared with me"). Anonymous: the public trips list.
export default function MyTripsContent() {
  const { status } = useAuth()
  const { trips, myTrips, sharedTrips, loaded, error, reload } = useTrips()
  const authed = status === 'authed'

  const empty = authed ? myTrips.length === 0 && sharedTrips.length === 0 : trips.length === 0
  const view = myTripsView({ ready: status !== 'loading', loaded, error, empty })
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
        {authed ? 'My trips' : 'Trips'}
      </h1>

      {view === 'error' ? (
        <div role="alert" className={emptyCardClass}>
          <CloudOff size={28} className="text-muted" aria-hidden />
          <p className="leading-normal text-muted">
            {authed ? 'Could not load your trips.' : 'Could not load trips.'}
          </p>
          <Button variant="secondary" onClick={reload}>
            <RotateCw size={16} className="flex-shrink-0" />
            Try again
          </Button>
        </div>
      ) : view === 'empty' ? (
        authed ? (
          <div className={emptyCardClass}>
            <p className="leading-normal text-muted">ยังไม่มีทริป เริ่มวางแผนทริปแรกกันเลย</p>
            <CreatePlanButton />
          </div>
        ) : (
          <div className={emptyCardClass}>
            <p className="leading-normal text-muted">No public trips yet.</p>
            <ButtonLink href={loginPath('/trips')} variant="secondary">
              <LogIn size={16} className="flex-shrink-0" />
              Log in
            </ButtonLink>
          </div>
        )
      ) : !authed ? (
        <TripGrid trips={trips} />
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
