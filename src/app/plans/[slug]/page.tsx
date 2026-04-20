import { Suspense } from 'react'

import PageLoading from '@/components/page-loading'
import { TripViewContent } from '@/sections/view-content'

export default async function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <Suspense fallback={<PageLoading />}>
      <TripViewContent slug={slug} />
    </Suspense>
  )
}
