import { Suspense } from 'react'
import TripViewContent from './trip-view-content'

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
    <Suspense fallback={<div className="p-8 text-gray-500">Loading...</div>}>
      <TripViewContent country={country} city={city} />
    </Suspense>
  )
}
