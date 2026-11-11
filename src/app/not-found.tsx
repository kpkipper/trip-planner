import { SearchX } from 'lucide-react'

import { ButtonLink } from '@/components/ui/button'
import { StatusCard } from '@/components/ui/status-card'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
}

// Static export: served as 404.html for any unknown path.
export default function NotFoundPage() {
  return (
    <StatusCard icon={<SearchX size={26} strokeWidth={1.75} />} title="404">
      <p className="mt-2 text-sm leading-relaxed text-muted">This page could not be found.</p>
      <ButtonLink href="/" variant="secondary" className="mt-6">
        Go home
      </ButtonLink>
    </StatusCard>
  )
}
