'use client'

import { useEffect, useRef, useState } from 'react'

import { Country } from 'country-state-city'

import { cn, fieldClass, fieldErrorClass } from '@/lib/ui-classes'

export { generateDays, uid } from './days'

export const ALL_COUNTRIES = Country.getAllCountries()
export const COUNTRY_NAMES = ALL_COUNTRIES.map((c: { name: string }) => c.name)

export const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
    .toString()
    .padStart(2, '0')
  const m = i % 2 === 0 ? '00' : '30'
  return `${h}:${m}`
})

// Suggestion dropdowns: a white tile floating over the form.
const listboxClass =
  'absolute z-50 mt-2 overflow-y-auto rounded-tile bg-surface p-1 text-sm shadow-soft ring-1 ring-line'
const optionClass = 'cursor-pointer rounded-tile px-3 py-2 leading-normal text-ink-2 hover:bg-chip hover:text-ink'

export function Autocomplete({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  hasError,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  disabled?: boolean
  hasError?: boolean
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtered = value.trim()
    ? options.filter((o) => o.toLowerCase().includes(value.toLowerCase()))
    : options

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(fieldClass, 'w-full', hasError && fieldErrorClass)}
      />
      {open && !disabled && filtered.length > 0 && (
        <ul className={cn(listboxClass, 'left-0 right-0 max-h-52')}>
          {filtered.map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(opt)
                setOpen(false)
              }}
              className={optionClass}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function TimeAutocomplete({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const digits = value.replace(/\D/g, '')
  const filtered =
    digits.length > 0
      ? TIME_OPTIONS.filter((opt) => opt.replace(/\D/g, '').startsWith(digits))
      : TIME_OPTIONS

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={containerRef} className="relative w-24">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="09:00"
        className={cn(fieldClass, 'w-full px-3 py-2 tabular-nums')}
      />
      {open && filtered.length > 0 && (
        <ul className={cn(listboxClass, 'left-0 w-28 max-h-48')}>
          {filtered.map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(opt)
                setOpen(false)
              }}
              className={cn(optionClass, 'py-1.5 tabular-nums')}
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
