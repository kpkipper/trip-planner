import MyTripsContent from '@/sections/trips/my-trips-content'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Trips',
  robots: { index: false, follow: false },
}

export default function MyTripsPage() {
  return <MyTripsContent />
}
