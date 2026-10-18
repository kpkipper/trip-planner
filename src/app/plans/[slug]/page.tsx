import { cache, Suspense } from 'react'

import { getJourneyBySlug, getJourneys } from '@/api/journey'
import PageLoading from '@/components/page-loading'
import { siteConfig } from '@/config/site'
import { TripViewContent } from '@/sections/view-content'
import { toTrip } from '@/utils/format-data'

import type { Metadata } from 'next'

// Cached so generateMetadata and the page render share a single fetch per slug.
const getTrip = cache(async (slug: string) => {
  const { data } = await getJourneyBySlug(slug)
  return toTrip(data)
})

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const { data } = await getJourneys()
  return data.flatMap((country) => country.plan.map((trip) => ({ slug: trip.slug })))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params

  try {
    const trip = await getTrip(slug)
    const place = [trip.destination, trip.country].filter(Boolean).join(', ')
    const title = trip.title || 'Trip Plan'
    const dayCount = trip.days?.length ?? 0
    const description =
      `${title}${place ? ` — a travel itinerary for ${place}` : ''}. ` +
      `${dayCount ? `A ${dayCount}-day plan. ` : ''}` +
      `Plan and explore your trip with ${siteConfig.name}.`
    const url = `/plans/${slug}`

    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'article',
        title,
        description,
        url,
        siteName: siteConfig.name,
      },
    }
  } catch {
    return { title: 'Trip Plan' }
  }
}

export default async function TripPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const trip = await getTrip(slug).catch(() => null)

  const jsonLd = trip
    ? {
        '@context': 'https://schema.org',
        '@type': 'TouristTrip',
        name: trip.title,
        description: [trip.destination, trip.country].filter(Boolean).join(', '),
        url: `${siteConfig.url}/plans/${slug}`,
        ...(trip.startDate ? { startDate: trip.startDate } : {}),
        ...(trip.endDate ? { endDate: trip.endDate } : {}),
        ...(trip.country
          ? { touristType: 'Leisure', itinerary: { '@type': 'Place', name: trip.country } }
          : {}),
        provider: { '@type': 'Organization', name: siteConfig.name, url: siteConfig.url },
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />
      )}
      <Suspense fallback={<PageLoading />}>
        <TripViewContent slug={slug} />
      </Suspense>
    </>
  )
}
