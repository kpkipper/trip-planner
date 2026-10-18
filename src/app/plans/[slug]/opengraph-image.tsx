import { getJourneyBySlug, getJourneys } from '@/api/journey'
import { siteConfig } from '@/config/site'
import { cleanText, OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/og'
import { toTrip } from '@/utils/format-data'

export const dynamic = 'force-static'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = `Trip itinerary on ${siteConfig.name}`

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  const { data } = await getJourneys()
  return data.flatMap((country) => country.plan.map((trip) => ({ slug: trip.slug })))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let title: string = siteConfig.name
  let place = 'Travel itinerary'

  try {
    const { data } = await getJourneyBySlug(slug)
    const trip = toTrip(data)
    title = cleanText(trip.title).slice(0, 42) || siteConfig.name
    place = cleanText([trip.destination, trip.country].filter(Boolean).join(', ')) || place
  } catch {
    // fall back to brand defaults
  }

  return ogImage({ eyebrow: 'JOURLY PLAN', title, subtitle: place })
}
