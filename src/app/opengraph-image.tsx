import { siteConfig } from '@/config/site'
import { OG_CONTENT_TYPE, OG_SIZE, ogImage } from '@/lib/og'

export const dynamic = 'force-static'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = `${siteConfig.name} — plan your trips and travel itineraries`

export default function Image() {
  return ogImage({
    eyebrow: 'JOURLY PLAN',
    title: 'Plan your trips, your way',
    subtitle: 'Day-by-day travel itineraries in one place',
  })
}
