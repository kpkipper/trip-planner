import { Suspense } from 'react'

import { getJourneys } from '@/api/journey'
import PageLoading from '@/components/page-loading'
import { CreateEditContent } from '@/sections/create-edit-content'

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
