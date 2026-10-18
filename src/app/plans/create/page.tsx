import { Suspense } from 'react'

import PageLoading from '@/components/page-loading'
import { CreateEditContent } from '@/sections/create-edit-content'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Plan',
  description: 'Create a new trip and build your travel itinerary with Jourly Plan.',
  robots: { index: false, follow: false },
}

export default function CreatePlanPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <CreateEditContent />
    </Suspense>
  )
}
