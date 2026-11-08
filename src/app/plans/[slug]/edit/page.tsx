import { Suspense } from 'react'

import PageLoading from '@/components/page-loading'
import { tripStaticParams } from '@/lib/public-slugs'
import { TripEditShell } from '@/sections/shell-pages'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Edit Plan',
  description: 'Edit your trip itinerary with Jourly Plan.',
  robots: { index: false, follow: false },
}

export const generateStaticParams = tripStaticParams

export default async function EditPlanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <Suspense fallback={<PageLoading />}>
      <TripEditShell slug={slug} />
    </Suspense>
  )
}
