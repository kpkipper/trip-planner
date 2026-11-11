'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { Plus } from 'lucide-react'

import PageLoading from '@/components/page-loading'
import TripCard from '@/components/trip-card'
import { ButtonLink } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useTrips } from '@/contexts/trips-context'
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
  const { myTrips, sharedTrips, loaded } = useTrips()

  useEffect(() => {
    if (status === 'anon') router.replace(loginPath('/trips'))
  }, [status, router])

  if (status !== 'authed') return <PageLoading />

  const empty = myTrips.length === 0 && sharedTrips.length === 0
  // The list refetches on every navigation; only show the spinner while nothing is there yet.
  if (!loaded && empty) return <PageLoading />

  return (
    <div className="px-4 py-8">
      <h1 className="mb-6 text-[28px] font-semibold leading-snug tracking-tight text-ink md:text-[40px]">
        My trips
      </h1>

      {empty ? (
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
