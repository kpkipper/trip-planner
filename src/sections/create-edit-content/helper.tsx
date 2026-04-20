'use client'

import { useEffect, useRef, useState } from 'react'

import { Country } from 'country-state-city'

import type { TripDay } from '@/types/trip'

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function formatDateDisplay(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
}

export function generateDays(startDate: string, endDate: string, existing: TripDay[]): TripDay[] {
  const days: TripDay[] = []
  const start = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')
  const cur = new Date(start)
  let i = 0
  while (cur <= end && i < 60) {
    const dateISO = cur.toISOString().split('T')[0]
    const dateDisplay = formatDateDisplay(dateISO)
    const prev = existing.find((d) => d.dateISO === dateISO)
    days.push(prev ?? { id: uid(), date: dateDisplay, dateISO, title: dateDisplay, activities: [] })
    cur.setDate(cur.getDate() + 1)
    i++
  }
  return days
}

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
        className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed ${
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
              className="px-3 py-2 cursor-pointer hover:bg-[#edf3f7] text-gray-700"
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
        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition"
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
              className="px-3 py-1.5 cursor-pointer hover:bg-[#edf3f7] text-gray-700"
            >
              {opt}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function EmojiButton({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 flex items-center justify-center text-lg rounded-lg border border-gray-200 hover:bg-gray-100 transition"
        title="Set emoji"
      >
        {value || '📍'}
      </button>
      {open && (
        <div className="absolute z-50 mt-1 left-0 bg-white border border-gray-200 rounded-xl shadow-lg p-3 w-44">
          <p className="text-xs text-gray-500 mb-1.5">Type or paste an emoji</p>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              const segments = [...new Intl.Segmenter().segment(e.target.value)]
              const last = segments.at(-1)?.segment ?? ''
              onChange(last)
            }}
            placeholder="📍"
            className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition mb-2"
          />
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              onChange('')
              setOpen(false)
            }}
            className="text-xs text-gray-500 hover:text-red-500 transition"
          >
            Reset to 📍
          </button>
        </div>
      )}
    </div>
  )
}
