'use client'

import { useTrips } from '@/contexts/trips-context'
import { toSlug } from '@/lib/slug'
import CreatePlanContent from '@/app/plans/create/create-plan-content'
import PageLoading from '@/components/page-loading'

export default function TripEditContent({ country, city }: { country: string; city: string }) {
  const { trips, loaded } = useTrips()

  if (!loaded) {
    return <PageLoading />
  }

  const trip = trips.find(
    (t) => toSlug(t.country) === country && toSlug(t.destination) === city,
  )

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Trip not found.</p>
        <button
          onClick={() => { window.location.href = '/' }}
          className="mt-3 text-[#0163a4] hover:underline text-sm"
        >
          Go back home
        </button>
      </div>
    )
  }

  return <CreatePlanContent editId={trip.id} country={country} city={city} />
}
