import InvitesContent from '@/sections/invites/invites-content'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Invites',
  robots: { index: false, follow: false },
}

export default function InvitesPage() {
  return <InvitesContent />
}
