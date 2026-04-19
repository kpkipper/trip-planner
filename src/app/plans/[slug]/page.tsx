import { Suspense } from 'react'
import { TripViewContent } from '@/sections/view-content'
import PageLoading from '@/components/page-loading'

export default async function TripPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return (
    <Suspense fallback={<PageLoading />}>
      <TripViewContent slug={slug} />
    </Suspense>
  )
}
