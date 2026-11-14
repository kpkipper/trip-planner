import { coverGradient } from './cover-gradient'
import { safeMediaUrl } from './safe-url'

import type { FeedItem } from '@/api/feed/type'

export type FeedCover =
  | { kind: 'photo'; src: string; extras: string[] }
  | { kind: 'cover'; src: string }
  | { kind: 'gradient'; background: string }

const MAX_THUMBS = 4

// Cover for a feed card: the event's first moment thumb (other thumbs as small extras), else
// the trip cover, else the trip's slug gradient. Only safe URLs are used.
export function feedCover(item: FeedItem): FeedCover {
  const thumbs = (item.moments?.thumbs ?? [])
    .map(safeMediaUrl)
    .filter((u): u is string => !!u)
    .slice(0, MAX_THUMBS)
  if (thumbs.length > 0) return { kind: 'photo', src: thumbs[0], extras: thumbs.slice(1) }
  const cover = safeMediaUrl(item.trip.cover_url)
  if (cover) return { kind: 'cover', src: cover }
  return { kind: 'gradient', background: coverGradient(item.trip.slug) }
}
