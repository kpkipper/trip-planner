import { MapIcon, Newspaper, UserPlus } from 'lucide-react'

import type { NavIcon } from '@/lib/nav'
import type { LucideIcon } from 'lucide-react'

export const NAV_ICONS: Record<NavIcon, LucideIcon> = {
  feed: Newspaper,
  trips: MapIcon,
  requests: UserPlus,
}
