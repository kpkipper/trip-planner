// Class strings for the shared ui blocks in src/components/ui. They live here
// as pure functions so the node-only vitest setup can test them.
//
// Thai text: every pill uses `leading-normal` (1.5) and no fixed height so
// tone marks and upper vowels never clip.

import { extendTailwindMerge } from 'tailwind-merge'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

type ClassPart = string | false | null | undefined

const join = (...parts: ClassPart[]) => parts.filter(Boolean).join(' ')

// Teach tailwind-merge our custom radius and shadow tokens so e.g.
// rounded-card vs rounded-tile resolve as a conflict.
const twMerge = extendTailwindMerge({
  extend: { theme: { radius: ['card', 'tile'], shadow: ['soft'] } },
})

/** Join class parts, dropping falsy ones; later classes win on conflicts. */
export function cn(...parts: ClassPart[]): string {
  return twMerge(join(...parts))
}

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
  return cn('bg-surface rounded-card shadow-soft', padding, className)
}

// Filled input/select/textarea. Width is left to the caller (most add w-full).
export const fieldClass =
  'rounded-tile border-0 bg-chip px-4 py-2.5 text-sm leading-normal text-ink placeholder:text-muted outline-none transition focus:outline-none focus:ring-2 focus:ring-accent focus:bg-surface disabled:opacity-50 disabled:cursor-not-allowed'

// Add next to fieldClass when the field has a validation error.
export const fieldErrorClass = 'ring-2 ring-danger/60'

// Form label above a field: 13px, medium, muted.
export const labelClass = 'text-[13px] font-medium leading-normal text-muted'

// A checkbox drawn as a switch (pair with role="switch"): chip track, primary when on,
// white knob. Fixed size is fine here: there is no text inside. The focus indicator is an
// outline outside the track (the track's own ring is inset, so a ring would draw inside it).
export const switchClass =
  "relative h-6 w-10 shrink-0 cursor-pointer appearance-none rounded-full bg-chip ring-1 ring-inset ring-line transition-colors before:absolute before:top-0.5 before:left-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow-sm before:transition-transform before:content-[''] checked:bg-primary checked:ring-primary checked:before:translate-x-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"

// A row in a dropdown menu (account menu, block menu, trip actions). The inset ring keeps the
// focus indicator visible inside the menu's rounded, overflow-hidden panel.
export function menuItemClass(tone: 'default' | 'danger' = 'default'): string {
  return join(
    'flex w-full items-center gap-2.5 px-4 py-2.5 text-sm leading-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
    tone === 'danger'
      ? 'text-danger hover:bg-danger/5 focus-visible:bg-danger/5'
      : 'text-ink-2 hover:bg-chip focus-visible:bg-chip',
  )
}
