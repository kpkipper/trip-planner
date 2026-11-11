import { cn } from '@/lib/ui-classes'

import type { ReactNode } from 'react'

interface Props {
  /** Outer diameter in px, ring included. */
  size?: number
  className?: string
  children: ReactNode
}

export function StoryRing({ size = 64, className = '', children }: Props) {
  return (
    <span
      className={cn('inline-block shrink-0 rounded-full bg-story-ring p-[3px]', className)}
      style={{ width: size, height: size }}
    >
      <span className="block h-full w-full overflow-hidden rounded-full border-[3px] border-surface bg-chip">
        {children}
      </span>
    </span>
  )
}
