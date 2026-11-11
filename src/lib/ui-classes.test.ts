import { describe, expect, it } from 'vitest'

import { buttonClass, cardClass, chipClass, cn, fieldClass } from './ui-classes'

const tokens = (s: string) => s.split(/\s+/).filter(Boolean)

const paddingX = (s: string) => {
  const t = tokens(s).find((c) => /^px-\d+(\.\d+)?$/.test(c))
  return t ? Number(t.slice(3)) : NaN
}

describe('buttonClass', () => {
  it('primary is a dark pill with white text', () => {
    const c = tokens(buttonClass('primary'))
    expect(c).toContain('bg-primary')
    expect(c).toContain('text-white')
    expect(c).toContain('rounded-full')
  })

  it('secondary is a white pill with a line ring', () => {
    const c = tokens(buttonClass('secondary'))
    expect(c).toContain('bg-surface')
    expect(c).toContain('ring-line')
    expect(c).toContain('rounded-full')
  })

  it('danger uses the danger colour', () => {
    const c = tokens(buttonClass('danger'))
    expect(c.includes('text-danger') || c.includes('bg-danger')).toBe(true)
  })

  it('size sm has smaller padding than md, md smaller than lg', () => {
    expect(paddingX(buttonClass('primary', 'sm'))).toBeLessThan(
      paddingX(buttonClass('primary', 'md')),
    )
    expect(paddingX(buttonClass('primary', 'md'))).toBeLessThan(
      paddingX(buttonClass('primary', 'lg')),
    )
  })

  it('defaults to md', () => {
    expect(buttonClass('primary')).toBe(buttonClass('primary', 'md'))
  })

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)(
    '%s has a focus ring and disabled state',
    (variant) => {
      const c = tokens(buttonClass(variant))
      expect(c).toContain('focus-visible:ring-2')
      expect(c).toContain('disabled:opacity-50')
    },
  )

  it('never clips Thai tone marks with leading-none or fixed heights', () => {
    for (const variant of ['primary', 'secondary', 'ghost', 'danger'] as const) {
      for (const size of ['sm', 'md', 'lg'] as const) {
        const c = tokens(buttonClass(variant, size))
        expect(c).not.toContain('leading-none')
        expect(c.some((t) => /^h-\d/.test(t))).toBe(false)
      }
    }
  })
})

describe('chipClass', () => {
  it('is a pill', () => {
    expect(tokens(chipClass())).toContain('rounded-full')
  })

  it('active uses the primary fill', () => {
    const c = tokens(chipClass(true))
    expect(c).toContain('bg-primary')
    expect(c).toContain('text-white')
    expect(tokens(chipClass(false))).toContain('bg-chip')
  })
})

describe('fieldClass', () => {
  it('is filled, rounded, borderless with an accent focus ring', () => {
    const c = tokens(fieldClass)
    expect(c).toContain('bg-chip')
    expect(c).toContain('rounded-tile')
    expect(c).toContain('border-0')
    expect(c).toContain('focus:ring-accent')
  })
})

describe('cardClass', () => {
  it('is a white soft card with default padding', () => {
    const c = tokens(cardClass())
    expect(c).toContain('bg-surface')
    expect(c).toContain('rounded-card')
    expect(c).toContain('shadow-soft')
    expect(c).toContain('p-6')
  })

  it('appends extra classes', () => {
    expect(tokens(cardClass('mt-4'))).toContain('mt-4')
  })
})

describe('cn', () => {
  it('drops falsy parts and joins', () => {
    expect(cn('a', false, undefined, null, '', 'b')).toBe('a b')
  })

  it('lets later classes override conflicting earlier ones', () => {
    expect(cn('bg-surface p-6', 'bg-chip')).toBe('p-6 bg-chip')
    expect(cn('px-4 py-2', 'px-6')).toBe('py-2 px-6')
  })

  it('knows the custom radius and shadow tokens', () => {
    expect(cn('rounded-card', 'rounded-tile')).toBe('rounded-tile')
    expect(cn('shadow-soft', 'shadow-xl')).toBe('shadow-xl')
  })

  it('keeps colour and size utilities that do not conflict', () => {
    expect(cn('text-sm text-ink', 'text-accent')).toBe('text-sm text-accent')
  })
})
