import { Suspense } from 'react'
import TripEditContent from './trip-edit-content'
import PageLoading from '@/components/page-loading'

export function generateStaticParams() {
  return [{ country: 'japan', city: 'tokyo' }]
}

export default async function TripEditPage({
  params,
}: {
  params: Promise<{ country: string; city: string }>
}) {
  const { country, city } = await params
  return (
    <Suspense fallback={<PageLoading />}>
      <TripEditContent country={country} city={city} />
    </Suspense>
  )
}
