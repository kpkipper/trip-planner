import BlocksContent from '@/sections/safety/blocks-content'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blocked users',
  robots: { index: false, follow: false },
}

export default function BlocksPage() {
  return <BlocksContent />
}
