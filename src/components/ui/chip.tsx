import { chipClass } from '@/lib/ui-classes'

import type { ComponentProps } from 'react'

interface Props extends ComponentProps<'span'> {
  active?: boolean
}

export function Chip({ active = false, className = '', ...props }: Props) {
  return <span className={`${chipClass(active)} ${className}`.trim()} {...props} />
}
