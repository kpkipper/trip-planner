import { getJourneys } from '@/api/journey'
import { siteConfig } from '@/config/site'

import type { MetadataRoute } from 'next'

export const dynamic = 'force-static'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let trips: MetadataRoute.Sitemap = []

  try {
    const { data } = await getJourneys()
    trips = data.flatMap((country) =>
      country.plan.map((trip) => ({
        url: `${siteConfig.url}/plans/${trip.slug}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    )
  } catch (err) {
    console.error('sitemap: failed to load journeys', err)
  }

  return [
    {
      url: siteConfig.url,
      changeFrequency: 'daily',
      priority: 1,
    },
    ...trips,
  ]
}
