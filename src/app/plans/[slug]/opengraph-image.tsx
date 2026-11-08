import { getJourneyBySlug } from '@/api/journey'
import { siteConfig } from '@/config/site'
import { cleanText, OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/og'
import { tripStaticParams } from '@/lib/public-slugs'
import { SHELL_PARAM } from '@/lib/shell-param'
import { toTrip } from '@/utils/format-data'

export const dynamic = 'force-static'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = `Trip itinerary on ${siteConfig.name}`

export const generateStaticParams = tripStaticParams

// Title and place only (no dates), see the note in page.tsx.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  let title: string = siteConfig.name
  let place = 'Travel itinerary'

  try {
    if (slug === SHELL_PARAM) throw new Error('shell')
    const { data } = await getJourneyBySlug(slug)
    const trip = toTrip(data)
    title = cleanText(trip.title).slice(0, 42) || siteConfig.name
    place = cleanText([trip.destination, trip.country].filter(Boolean).join(', ')) || place
  } catch {
    // fall back to brand defaults
  }

  return ogImage({ eyebrow: 'JOURLY PLAN', title, subtitle: place })
}
