'use client'

import React, { useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import {
  PlaneTakeoff,
  Plus,
  ChevronDown,
  ChevronRight,
  MapPin,
  Menu,
  X,
  FolderOpen,
  Upload,
} from 'lucide-react'
import { useTrips } from '@/contexts/trips-context'
import { toSlug } from '@/lib/slug'
import type { Trip } from '@/types/trip'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const PLACEHOLDER_COUNTRIES: Record<string, string[]> = {
  Japan: [],
  China: [],
}

const BUILTIN_TRIPS: { country: string; label: string; href: string }[] = [
  { country: 'Japan', label: 'Tokyo 2025', href: '/japan/tokyo' },
  { country: 'Japan', label: 'Osaka 2026', href: '/japan/osaka' },
]

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { trips, addTrip } = useTrips()
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set(['Japan']))
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const trip = JSON.parse(ev.target?.result as string) as Trip
        if (!trip.id || !trip.title || !trip.destination || !trip.country) {
          alert('Invalid trip file.')
          return
        }
        // Give it a new ID to avoid conflicts
        const imported: Trip = { ...trip, id: `imported-${Date.now()}` }
        addTrip(imported)
        window.location.href = `/${toSlug(imported.country)}/${toSlug(imported.destination)}`
      } catch {
        alert('Failed to parse trip file.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const toggleCountry = (country: string) => {
    setExpandedCountries((prev) => {
      const next = new Set(prev)
      if (next.has(country)) next.delete(country)
      else next.add(country)
      return next
    })
  }

  const tripsByCountry = trips.reduce<Record<string, typeof trips>>((acc, trip) => {
    const key = trip.country || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(trip)
    return acc
  }, {})

  const allCountries = Array.from(
    new Set([...Object.keys(PLACEHOLDER_COUNTRIES), ...Object.keys(tripsByCountry)]),
  )

  return (
    <div
      className={`flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-100">
        {!collapsed && (
          <span className="font-bold text-[#0163a4] flex items-center gap-2 text-sm">
            <PlaneTakeoff size={18} />
            Trip Planner
          </span>
        )}
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors ${
            collapsed ? 'mx-auto' : ''
          }`}
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Create Plan + Import */}
      <div className="px-3 py-3 flex flex-col gap-2">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/plans/create">
          <button
            className={`flex items-center gap-2 w-full rounded-lg px-3 py-2.5 bg-[#0163a4] text-white hover:bg-[#0470b9] transition-colors text-sm font-medium ${
              collapsed ? 'justify-center px-2' : ''
            }`}
          >
            <Plus size={18} className="flex-shrink-0" />
            {!collapsed && 'Create Plan'}
          </button>
        </a>
        <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`flex items-center gap-2 w-full rounded-lg px-3 py-2.5 border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium ${
            collapsed ? 'justify-center px-2' : ''
          }`}
        >
          <Upload size={18} className="flex-shrink-0" />
          {!collapsed && 'Import Plan'}
        </button>
      </div>

      {/* My Plans */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {!collapsed && (
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 mt-1">
            My Plans
          </div>
        )}

        {allCountries.map((country) => {
          const isExpanded = expandedCountries.has(country)
          const tripsForCountry = tripsByCountry[country] || []
          const placeholders = (PLACEHOLDER_COUNTRIES[country] || []).filter(
            (dest) => !tripsForCountry.some((t) => t.destination === dest),
          )

          return (
            <div key={country} className="mb-1">
              <button
                onClick={() => toggleCountry(country)}
                className={`flex items-center gap-2 w-full rounded-md px-2 py-1.5 hover:bg-gray-100 text-gray-700 transition-colors text-sm ${
                  collapsed ? 'justify-center' : ''
                }`}
              >
                <FolderOpen size={15} className="text-[#0163a4] flex-shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left font-medium">{country}</span>
                    {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </>
                )}
              </button>

              {(isExpanded || collapsed) && (
                <div className={collapsed ? '' : 'ml-3'}>
                  {BUILTIN_TRIPS.filter((b) => b.country === country).map((b) => (
                    <a key={b.href} href={b.href}>
                      <div
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                          pathname === b.href
                            ? 'bg-[#edf3f7] text-[#0163a4] font-medium'
                            : 'hover:bg-gray-50 text-gray-600'
                        } ${collapsed ? 'justify-center' : ''}`}
                      >
                        <MapPin size={13} className="flex-shrink-0" />
                        {!collapsed && b.label}
                      </div>
                    </a>
                  ))}

                  {tripsForCountry
                    .filter((trip) => {
                      const href = `/${toSlug(trip.country)}/${toSlug(trip.destination)}`
                      return !BUILTIN_TRIPS.some((b) => b.href === href)
                    })
                    .map((trip) => {
                    const href = `/${toSlug(trip.country)}/${toSlug(trip.destination)}`
                    return (
                      <a key={trip.id} href={href}>
                        <div
                          className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                            pathname === href
                              ? 'bg-[#edf3f7] text-[#0163a4] font-medium'
                              : 'hover:bg-gray-50 text-gray-600'
                          } ${collapsed ? 'justify-center' : ''}`}
                        >
                          <MapPin size={13} className="flex-shrink-0" />
                          {!collapsed && `${trip.destination} ${new Date(trip.startDate).getFullYear()}`}
                        </div>
                      </a>
                    )
                  })}

                  {placeholders.map((dest) => (
                    <div
                      key={dest}
                      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-gray-400 ${
                        collapsed ? 'justify-center' : ''
                      }`}
                    >
                      <MapPin size={13} className="flex-shrink-0 opacity-40" />
                      {!collapsed && <span className="italic">{dest}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
