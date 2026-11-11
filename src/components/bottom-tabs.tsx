'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { LogIn, Plus } from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { badgeLabel } from '@/lib/follow-requests'
import { isActive, isProfilePath, navItems } from '@/lib/nav'
import { isAuthPath, loginPath } from '@/lib/safe-next'
import { cn } from '@/lib/ui-classes'

import AccountMenu from './account-menu'
import Logo from './logo'
import { NAV_ICONS } from './nav-icons'
import { ButtonLink } from './ui/button'

// Sits above the safe area, below dialogs (z-40/50) and the story viewer (z-40).
const barPosition =
  'fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 md:hidden'
const glass = 'rounded-full bg-surface/85 shadow-soft ring-1 ring-line backdrop-blur-md'

const tabClass = (active: boolean) =>
  cn(
    'relative flex min-w-14 flex-col items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-medium leading-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    active ? 'text-ink' : 'text-muted',
  )

// Mobile (below md): floating tab bar. Anonymous visitors get a single Log in bar.
export default function BottomTabs({ pending }: { pending: number }) {
  const pathname = usePathname()
  const { status, user } = useAuth()

  if (status === 'loading') return null

  if (status !== 'authed' || !user) {
    // The login pages are the Log in screen already; the bar would only cover the form.
    if (isAuthPath(pathname)) return null
    const [anonTrips] = navItems(false)
    const TripsIcon = NAV_ICONS[anonTrips.icon]
    return (
      <nav
        aria-label="Main"
        className={cn(barPosition, glass, 'flex items-center justify-between gap-3 py-2 pr-2 pl-4')}
      >
        <Link
          href="/"
          className="min-w-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Logo size={24} />
        </Link>
        <div className="flex items-center gap-1">
          <ButtonLink
            href={anonTrips.href}
            variant="ghost"
            aria-current={isActive(pathname, anonTrips.href) ? 'page' : undefined}
            className={cn(isActive(pathname, anonTrips.href) && 'bg-chip text-ink')}
          >
            <TripsIcon size={16} className="flex-shrink-0" />
            {anonTrips.shortLabel}
          </ButtonLink>
          <ButtonLink href={loginPath(pathname)}>
            <LogIn size={16} className="flex-shrink-0" />
            Log in
          </ButtonLink>
        </div>
      </nav>
    )
  }

  const [feed, trips, requests] = navItems(true)
  const badge = badgeLabel(pending)
  const ownProfile = isProfilePath(pathname, user.username)

  const tab = (item: typeof feed) => {
    const Icon = NAV_ICONS[item.icon]
    const active = isActive(pathname, item.href)
    const showBadge = item.icon === 'requests' && badge
    return (
      <Link
        href={item.href}
        aria-label={showBadge ? `${item.label}, ${pending} pending` : item.label}
        aria-current={active ? 'page' : undefined}
        className={tabClass(active)}
      >
        <span className="relative">
          <Icon size={22} strokeWidth={active ? 2.25 : 1.75} />
          {showBadge && (
            <span
              aria-hidden
              className="absolute -top-1.5 left-3.5 rounded-full bg-primary px-1.5 text-[10px] font-semibold leading-normal text-white ring-2 ring-surface"
            >
              {badge}
            </span>
          )}
        </span>
        {/* Short label so five tabs fit at 375px; the full label stays the accessible name. */}
        {item.shortLabel}
      </Link>
    )
  }

  return (
    <nav aria-label="Main" className={cn(barPosition, glass, 'px-2 py-1.5')}>
      <ul className="flex items-center justify-around">
        <li>{tab(feed)}</li>
        <li>{tab(trips)}</li>
        <li>
          <Link
            href="/plans/create"
            aria-label="Create Plan"
            className="grid h-12 w-12 place-items-center rounded-full bg-primary text-white transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          >
            <Plus size={24} />
          </Link>
        </li>
        <li>{tab(requests)}</li>
        <li>
          <AccountMenu variant="tab" active={ownProfile} />
        </li>
      </ul>
    </nav>
  )
}
