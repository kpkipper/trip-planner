import { chipClass, cn } from '@/lib/ui-classes'

import type { ComponentProps } from 'react'

interface Props extends ComponentProps<'span'> {
  active?: boolean
}

export function Chip({ active = false, className = '', ...props }: Props) {
  return <span className={cn(chipClass(active), className)} {...props} />
}
