import { Card } from './card'

import type { ReactNode } from 'react'

interface Props {
  icon?: ReactNode
  title: ReactNode
  /** Heading level; pages use h1, inline states (e.g. NotFound inside a page) h2. */
  titleAs?: 'h1' | 'h2'
  children?: ReactNode
}

// A centred card on the page background for one-off states: not found, a failed login link,
// a join link that did not work.
export function StatusCard({ icon, title, titleAs: Heading = 'h1', children }: Props) {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-4 py-10">
      <Card padding="p-8" className="w-full max-w-sm text-center">
        {icon && (
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-tile bg-chip text-ink">
            {icon}
          </div>
        )}
        <Heading className="break-words text-xl font-semibold leading-normal tracking-tight text-ink">
          {title}
        </Heading>
        {children}
      </Card>
    </div>
  )
}
