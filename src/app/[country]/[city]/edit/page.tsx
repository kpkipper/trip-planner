import { Suspense } from 'react'
import TripEditContent from './trip-edit-content'

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
    <Suspense fallback={<div className="p-8 text-gray-500">Loading...</div>}>
      <TripEditContent country={country} city={city} />
    </Suspense>
  )
}
