'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Plus } from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { badgeLabel } from '@/lib/follow-requests'
import { isActive, navItems } from '@/lib/nav'
import { loginPath } from '@/lib/safe-next'
import { buttonClass, cn } from '@/lib/ui-classes'

import AccountMenu from './account-menu'
import Logo from './logo'
import { NAV_ICONS } from './nav-icons'
import { ButtonLink } from './ui/button'

// Desktop (md and up): sticky floating glass pill at the top of the scroll root.
export default function TopNav({ pending }: { pending: number }) {
  const pathname = usePathname()
  const { status } = useAuth()
  // Nothing while the login state is unknown, so the anonymous list never flashes for members.
  const items = status === 'loading' ? [] : navItems(status === 'authed')
  const badge = badgeLabel(pending)

  return (
    <div className="sticky top-3 z-30 mt-3 hidden px-4 md:block">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-6xl items-center gap-2 rounded-full bg-surface/75 py-2 pr-2 pl-5 shadow-soft backdrop-blur-md"
      >
        <Link
          href="/"
          className="mr-3 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <Logo size={28} />
        </Link>

        <ul className="flex min-w-0 items-center gap-1">
          {items.map((item) => {
            const Icon = NAV_ICONS[item.icon]
            const active = isActive(pathname, item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium leading-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
                    active ? 'bg-chip text-ink' : 'text-muted hover:bg-chip/60 hover:text-ink',
                  )}
                >
                  <Icon size={16} className="flex-shrink-0" />
                  {/* Short label below lg so the bar fits; the full label stays the accessible name. */}
                  <span aria-hidden className="lg:hidden">
                    {item.shortLabel}
                  </span>
                  <span className="sr-only lg:not-sr-only">{item.label}</span>
                  {item.icon === 'requests' && badge && (
                    <span
                      role="status"
                      aria-label={`${pending} pending`}
                      className="rounded-full bg-primary px-1.5 text-xs font-semibold leading-normal text-white"
                    >
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        <span className="flex-1" />

        {/* Create Plan needs a login; anonymous users go to login first. */}
        {status === 'loading' ? (
          <span
            aria-disabled
            className={cn(buttonClass('primary'), 'cursor-not-allowed opacity-50')}
          >
            <Plus size={16} className="flex-shrink-0" />
            Create Plan
          </span>
        ) : (
          <ButtonLink
            href={status === 'authed' ? '/plans/create' : loginPath('/plans/create')}
            aria-label="Create Plan"
          >
            <Plus size={16} className="flex-shrink-0" />
            Create Plan
          </ButtonLink>
        )}

        <AccountMenu variant="nav" />
      </nav>
    </div>
  )
}
