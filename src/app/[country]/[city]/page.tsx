import { Suspense } from 'react'
import TripViewContent from './trip-view-content'
import PageLoading from '@/components/page-loading'

export function generateStaticParams() {
  return [
    { country: 'japan', city: 'tokyo' },
    { country: 'japan', city: 'osaka' },
  ]
}

export default async function TripPage({
  params,
}: {
  params: Promise<{ country: string; city: string }>
}) {
  const { country, city } = await params
  return (
    <Suspense fallback={<PageLoading />}>
      <TripViewContent country={country} city={city} />
    </Suspense>
  )
}
