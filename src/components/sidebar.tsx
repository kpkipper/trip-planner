'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'
import { useTrips } from '@/contexts/trips-context'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { trips } = useTrips()
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set())

  // Auto-expand countries that have trips
  React.useEffect(() => {
    const countries = trips.map((t) => t.country).filter(Boolean)
    if (countries.length > 0) {
      setExpandedCountries((prev) => new Set([...prev, ...countries]))
    }
  }, [trips])

  const toggleCountry = (country: string) => {
    setExpandedCountries((prev) => {
      const next = new Set(prev)
      if (next.has(country)) next.delete(country)
      else next.add(country)
      return next
    })
  }

  const latestTrip =
    trips
      .slice()
      .sort((a, b) => (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) - (a.updatedAt ? new Date(a.updatedAt).getTime() : 0))[0] ?? null

  const tripsByCountry = trips.reduce<Record<string, typeof trips>>((acc, trip) => {
    const key = trip.country || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(trip)
    return acc
  }, {})

  const allCountries = Object.keys(tripsByCountry)

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

      {/* Create Plan */}
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
      </div>

      {/* Latest Trip */}
      {!collapsed && latestTrip && (
        <div className="px-3 pb-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1.5">
            Latest
          </div>
          <a href={`/plans/${latestTrip.slug}`}>
            <div
              className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                pathname === `/plans/${latestTrip.slug}`
                  ? 'bg-[#edf3f7] border-[#0163a4]/30 text-[#0163a4]'
                  : 'bg-gray-50 border-gray-200 hover:bg-[#edf3f7] text-gray-700'
              }`}
            >
              <div className="font-medium truncate">{latestTrip.title}</div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <MapPin size={10} />
                <span className="truncate">
                  {latestTrip.destination}, {latestTrip.country}
                </span>
              </div>
            </div>
          </a>
        </div>
      )}

      {/* My Plans */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {!collapsed && allCountries.length > 0 && (
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 mt-1">
            My Plans
          </div>
        )}

        {allCountries.map((country) => {
          const isExpanded = expandedCountries.has(country)
          const tripsForCountry = tripsByCountry[country] || []

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
                  {tripsForCountry.map((trip) => {
                    const href = `/plans/${trip.slug}`
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
                          {!collapsed && trip.title}
                        </div>
                      </a>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
