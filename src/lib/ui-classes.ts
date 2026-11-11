// Class strings for the shared ui blocks in src/components/ui. They live here
// as pure functions so the node-only vitest setup can test them.
//
// Thai text: every pill uses `leading-normal` (1.5) and no fixed height so
// tone marks and upper vowels never clip.

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const join = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

const buttonBase =
  'inline-flex items-center justify-center gap-2 rounded-full font-medium leading-normal whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary: 'bg-surface text-ink ring-1 ring-inset ring-line hover:bg-chip',
  ghost: 'bg-transparent text-ink-2 hover:bg-chip hover:text-ink',
  danger: 'bg-danger text-white hover:bg-danger/90',
}

const buttonSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export function buttonClass(variant: ButtonVariant, size: ButtonSize = 'md'): string {
  return join(buttonBase, buttonVariants[variant], buttonSizes[size])
}

export function chipClass(active = false): string {
  return join(
    'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium leading-normal whitespace-nowrap transition-colors',
    active ? 'bg-primary text-white' : 'bg-chip text-ink-2',
  )
}

export function cardClass(className = '', padding = 'p-6'): string {
  return join('bg-surface rounded-card shadow-soft', padding, className)
}

// Filled input/select/textarea. Width is left to the caller (most add w-full).
export const fieldClass =
  'rounded-tile border-0 bg-chip px-4 py-2.5 text-sm leading-normal text-ink placeholder:text-muted outline-none transition focus:outline-none focus:ring-2 focus:ring-accent focus:bg-surface disabled:opacity-50 disabled:cursor-not-allowed'

// Add next to fieldClass when the field has a validation error.
export const fieldErrorClass = 'ring-2 ring-danger/60'
