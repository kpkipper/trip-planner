import FeedContent from '@/sections/feed/feed-content'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Feed',
  robots: { index: false, follow: false },
}

export default function FeedPage() {
  return <FeedContent />
}
