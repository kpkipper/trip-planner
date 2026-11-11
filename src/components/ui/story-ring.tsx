import { cn } from '@/lib/ui-classes'

import type { ReactNode } from 'react'

interface Props {
  /** Outer diameter in px, ring included. */
  size?: number
  /** Seen stories get a grey ring instead of the gradient. */
  seen?: boolean
  className?: string
  children: ReactNode
}

export function StoryRing({ size = 64, seen = false, className = '', children }: Props) {
  return (
    <span
      className={cn(
        'inline-block shrink-0 rounded-full p-[3px]',
        seen ? 'bg-muted/30' : 'bg-story-ring',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <span className="block h-full w-full overflow-hidden rounded-full border-[3px] border-surface bg-chip">
        {children}
      </span>
    </span>
  )
}
