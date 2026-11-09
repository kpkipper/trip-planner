'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  MapPin,
  Menu,
  Newspaper,
  Plus,
  UserPlus,
  X,
} from 'lucide-react'

import { listFollowRequests } from '@/api/follows'
import { useAuth } from '@/contexts/auth-context'
import { useTrips } from '@/contexts/trips-context'
import { badgeLabel } from '@/lib/follow-requests'
import { loginPath } from '@/lib/safe-next'
import { statusLabel } from '@/lib/trip-status'

import AccountMenu from './account-menu'
import Logo from './logo'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const { trips, myTrips, sharedTrips } = useTrips()
  const { status } = useAuth()
  const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set())

  const [pending, setPending] = useState(0)

  // Pending follow-request count: refreshed on navigation; errors never show or redirect.
  useEffect(() => {
    if (status !== 'authed') return
    let cancelled = false
    listFollowRequests({ skipAuthRedirect: true })
      .then(({ count }) => {
        if (!cancelled) setPending(count)
      })
      .catch(() => {
        if (!cancelled) setPending(0)
      })
    return () => {
      cancelled = true
    }
  }, [status, pathname])

  const [seenTrips, setSeenTrips] = useState(trips)

  // Auto-expand countries that have trips whenever the trip list changes
  if (seenTrips !== trips) {
    setSeenTrips(trips)
    const countries = trips.map((t) => t.country).filter(Boolean)
    if (countries.length > 0) {
      setExpandedCountries((prev) => new Set([...prev, ...countries]))
    }
  }

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
      .sort(
        (a, b) =>
          (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) -
          (a.updatedAt ? new Date(a.updatedAt).getTime() : 0),
      )[0] ?? null

  const tripsByCountry = trips.reduce<Record<string, typeof trips>>((acc, trip) => {
    const key = trip.country || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(trip)
    return acc
  }, {})

  const allCountries = Object.keys(tripsByCountry)
  const authed = status === 'authed'

  const renderTripGroup = (heading: string, list: typeof trips) =>
    list.length > 0 && (
      <div className="mb-3">
        {!collapsed && (
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 mt-1">
            {heading}
          </div>
        )}
        {list.map((trip) => {
          const href = `/plans/${encodeURIComponent(trip.slug ?? '')}`
          const badge = statusLabel(trip.status)
          return (
            <a key={trip.slug} href={href} title={trip.title}>
              <div
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors ${
                  pathname === href
                    ? 'bg-[#edf3f7] text-[#0163a4] font-medium'
                    : 'hover:bg-gray-50 text-gray-600'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <MapPin size={13} className="flex-shrink-0" />
                {!collapsed && <span className="flex-1 truncate">{trip.title}</span>}
                {!collapsed && badge && (
                  <span role="img" aria-label={badge.text}>
                    {badge.emoji}
                  </span>
                )}
              </div>
            </a>
          )
        })}
      </div>
    )

  return (
    <div
      className={`flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-100">
        {!collapsed && <Logo size={32} />}
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors ${
            collapsed ? 'mx-auto' : ''
          }`}
        >
          {collapsed ? <Menu size={20} /> : <X size={20} />}
        </button>
      </div>

      {/* Create Plan: needs login; anonymous users go to login first */}
      <div className="px-3 py-3 flex flex-col gap-2">
        {status === 'loading' ? (
          <div
            aria-disabled
            className={`flex items-center gap-2 w-full rounded-lg px-3 py-2.5 bg-[#0163a4] text-white opacity-50 text-sm font-medium cursor-not-allowed ${
              collapsed ? 'justify-center px-2' : ''
            }`}
          >
            <Plus size={18} className="flex-shrink-0" />
            {!collapsed && 'Create Plan'}
          </div>
        ) : (
          <Link
            href={status === 'authed' ? '/plans/create' : loginPath('/plans/create')}
            className={`flex items-center gap-2 w-full rounded-lg px-3 py-2.5 bg-[#0163a4] text-white hover:bg-[#0470b9] transition-colors text-sm font-medium ${
              collapsed ? 'justify-center px-2' : ''
            }`}
            aria-label="Create Plan"
          >
            <Plus size={18} className="flex-shrink-0" />
            {!collapsed && 'Create Plan'}
          </Link>
        )}
      </div>

      {authed && (
        <div className="px-3 pb-2">
          <Link
            href="/feed"
            title="Feed"
            className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
              pathname === '/feed' || pathname === '/feed/'
                ? 'bg-[#edf3f7] text-[#0163a4] font-medium'
                : 'hover:bg-gray-50 text-gray-600'
            } ${collapsed ? 'justify-center' : ''}`}
          >
            <Newspaper size={15} className="flex-shrink-0" />
            {!collapsed && 'Feed'}
          </Link>
          <Link
            href="/follow-requests"
            title="Follow requests"
            className={`relative mt-1 flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors ${
              pathname === '/follow-requests' || pathname === '/follow-requests/'
                ? 'bg-[#edf3f7] text-[#0163a4] font-medium'
                : 'hover:bg-gray-50 text-gray-600'
            } ${collapsed ? 'justify-center' : ''}`}
          >
            <UserPlus size={15} className="flex-shrink-0" />
            {!collapsed && <span className="flex-1">Follow requests</span>}
            {badgeLabel(pending) && (
              <span
                aria-label={`${pending} pending`}
                className={`rounded-full bg-[#0163a4] px-1.5 text-xs font-semibold text-white ${
                  collapsed ? 'absolute -right-0.5 -top-0.5 text-[10px]' : ''
                }`}
              >
                {badgeLabel(pending)}
              </span>
            )}
          </Link>
        </div>
      )}

      {/* Latest Trip */}
      {!collapsed && latestTrip && (
        <div className="px-3 pb-2">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1.5">
            Latest
          </div>
          <a href={`/plans/${encodeURIComponent(latestTrip.slug ?? '')}`}>
            <div
              className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                pathname === `/plans/${encodeURIComponent(latestTrip.slug ?? '')}`
                  ? 'bg-[#edf3f7] border-[#0163a4]/30 text-[#0163a4]'
                  : 'bg-gray-50 border-gray-200 hover:bg-[#edf3f7] text-gray-700'
              }`}
            >
              <div className="font-medium truncate">{latestTrip.title}</div>
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <MapPin size={10} />
                <span className="truncate">
                  {[latestTrip.destination, latestTrip.country].filter(Boolean).join(', ')}
                </span>
              </div>
            </div>
          </a>
        </div>
      )}

      {/* My Plans */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {authed && (
          <>
            {renderTripGroup('My trips', myTrips)}
            {renderTripGroup('Shared with me', sharedTrips)}
          </>
        )}

        {!authed && !collapsed && allCountries.length > 0 && (
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2 mt-1">
            My Plans
          </div>
        )}

        {(authed ? [] : allCountries).map((country) => {
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
                    const href = `/plans/${encodeURIComponent(trip.slug ?? '')}`
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

      {/* Account */}
      <div className="px-3 py-3 border-t border-gray-100">
        <AccountMenu collapsed={collapsed} />
      </div>
    </div>
  )
}
