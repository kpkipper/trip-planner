'use client'

import { useEffect, useRef, useState } from 'react'

import { Country } from 'country-state-city'

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
        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
          hasError ? 'border-red-400' : 'border-gray-300'
        }`}
      />
      {open && !disabled && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 left-0 right-0 max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm">
          {filtered.map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(opt)
                setOpen(false)
              }}
              className="px-3 py-2 cursor-pointer hover:bg-chip text-gray-700"
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
    <div ref={containerRef} className="relative w-20">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="09:00"
        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 left-0 w-24 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg text-sm">
          {filtered.map((opt) => (
            <li
              key={opt}
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(opt)
                setOpen(false)
              }}
              className="px-3 py-1.5 cursor-pointer hover:bg-chip text-gray-700"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
