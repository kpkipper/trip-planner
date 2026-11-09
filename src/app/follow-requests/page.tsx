import FollowRequestsContent from '@/sections/follows/follow-requests-content'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Follow requests',
  robots: { index: false, follow: false },
}

export default function FollowRequestsPage() {
  return <FollowRequestsContent />
}
