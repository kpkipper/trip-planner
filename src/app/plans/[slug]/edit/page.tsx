import { Suspense } from 'react'

import { getJourneys } from '@/api/journey'
import PageLoading from '@/components/page-loading'
import { CreateEditContent } from '@/sections/create-edit-content'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Plan',
  description: 'Edit your trip itinerary with Jourly Plan.',
  robots: { index: false, follow: false },
}

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const { data } = await getJourneys()
  return data.flatMap((country) => country.plan.map((trip) => ({ slug: trip.slug })))
}

export default async function EditPlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <Suspense fallback={<PageLoading />}>
      <CreateEditContent slug={slug} />
    </Suspense>
  )
}
