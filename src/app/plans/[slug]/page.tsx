import { cache, Suspense } from 'react'

import { getJourneyBySlug } from '@/api/journey'
import { TripPageSkeleton } from '@/components/page-loading'
import { siteConfig } from '@/config/site'
import { tripStaticParams } from '@/lib/public-slugs'
import { SHELL_PARAM } from '@/lib/shell-param'
import { TripViewShell } from '@/sections/shell-pages'
import { toTrip } from '@/utils/format-data'

import type { Metadata } from 'next'

// Prerendered pages outlive a trip's visibility (a trip made private after the build keeps
// its page until the next deploy), so only title, place and cover are baked in: no dates and
// no day count in the description, JSON-LD or OG image.
// Cached so generateMetadata and the page render share a single fetch per slug.
const getTrip = cache(async (slug: string) => {
  const { data } = await getJourneyBySlug(slug)
  return toTrip(data)
})

export const generateStaticParams = tripStaticParams

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  if (slug === SHELL_PARAM) return { robots: { index: false, follow: false } }

  try {
    const trip = await getTrip(slug)
    const place = [trip.destination, trip.country].filter(Boolean).join(', ')
    const title = trip.title || 'Trip Plan'
    const description =
      `${title}${place ? ` — a travel itinerary for ${place}` : ''}. ` +
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
  const trip = slug === SHELL_PARAM ? null : await getTrip(slug).catch(() => null)

  const jsonLd = trip
    ? {
        '@context': 'https://schema.org',
        '@type': 'TouristTrip',
        name: trip.title,
        description: [trip.destination, trip.country].filter(Boolean).join(', '),
        url: `${siteConfig.url}/plans/${slug}`,
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
      <Suspense fallback={<TripPageSkeleton />}>
        <TripViewShell slug={slug} />
      </Suspense>
    </>
  )
}
