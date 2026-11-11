import { cardClass } from '@/lib/ui-classes'

import type { ComponentProps } from 'react'

interface Props extends ComponentProps<'div'> {
  /** Padding utility; defaults to p-6. Pass '' for none. */
  padding?: string
}

export function Card({ className = '', padding = 'p-6', ...props }: Props) {
  return <div className={cardClass(className, padding)} {...props} />
}
