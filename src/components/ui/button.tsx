import Link from 'next/link'

import { buttonClass, type ButtonSize, type ButtonVariant, cn } from '@/lib/ui-classes'

import type { ComponentProps } from 'react'

interface StyleProps {
  variant?: ButtonVariant
  size?: ButtonSize
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...props
}: StyleProps & ComponentProps<'button'>) {
  return (
    <button
      type={type}
      className={cn(buttonClass(variant, size), className)}
      {...props}
    />
  )
}

export function ButtonLink({
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: StyleProps & ComponentProps<typeof Link>) {
  return <Link className={cn(buttonClass(variant, size), className)} {...props} />
}
