'use client'

import { useEffect, useId, useRef, useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Ban, ImageIcon, Inbox, LogIn, LogOut, UserRound } from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { useInvites } from '@/contexts/invites-context'
import { loginPath } from '@/lib/safe-next'
import { buttonClass, cn } from '@/lib/ui-classes'

import UserAvatar from './user-avatar'

interface Props {
  /**
   * `nav`: avatar button in the desktop top nav, menu opens below.
   * `tab`: the "Me" tab of the mobile tab bar, menu opens above the bar.
   */
  variant?: 'nav' | 'tab'
  /** Mobile tab is highlighted while on the viewer's own profile. */
  active?: boolean
}

const itemClass =
  'flex items-center gap-2.5 w-full px-4 py-2.5 text-sm leading-normal text-ink-2 hover:bg-chip focus-visible:bg-chip focus-visible:outline-none transition-colors'

export default function AccountMenu({ variant = 'nav', active = false }: Props) {
  const pathname = usePathname()
  const { status, user, logout } = useAuth()
  const { invites } = useInvites()
  const inviteCount = invites.length
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const panelId = useId()
  const [openedAt, setOpenedAt] = useState(pathname)

  // Close after navigating (e.g. browser back while the menu is open).
  if (openedAt !== pathname) {
    setOpenedAt(pathname)
    setMenuOpen(false)
  }

  useEffect(() => {
    if (!menuOpen) return
    // Keyboard users land on the first item.
    panelRef.current?.querySelector<HTMLElement>('a[href], button')?.focus()
    const onMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setMenuOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  if (status === 'loading') {
    return variant === 'tab' ? (
      <span aria-hidden className="block h-6 w-6 rounded-full bg-chip" />
    ) : (
      <span aria-hidden className="block h-9 w-9 rounded-full bg-chip" />
    )
  }

  if (status === 'anon' || !user) {
    return (
      <Link href={loginPath(pathname)} className={buttonClass('secondary', 'md')}>
        <LogIn size={16} className="flex-shrink-0" />
        Log in
      </Link>
    )
  }

  const close = () => setMenuOpen(false)

  // Tabbing out of the menu closes it, so it never stays open behind the focus. A null
  // relatedTarget (a click on nothing focusable, or Safari not focusing clicked links) is left to
  // the outside-click handler, so a click on a menu item is never lost.
  const onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget
    if (menuOpen && next && !e.currentTarget.contains(next)) close()
  }

  const label = inviteCount > 0 ? `Account menu, ${inviteCount} pending invites` : 'Account menu'

  const dot = inviteCount > 0 && (
    <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-surface" />
  )

  return (
    <div className="relative" ref={menuRef} onBlur={onBlur}>
      {variant === 'tab' ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            'flex min-w-14 flex-col items-center gap-0.5 rounded-full px-2 py-1 text-[11px] font-medium leading-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            active || menuOpen ? 'text-ink' : 'text-muted',
          )}
          aria-label={`Me, ${label.charAt(0).toLowerCase()}${label.slice(1)}`}
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? panelId : undefined}
        >
          <span
            className={cn(
              'relative rounded-full ring-2',
              active || menuOpen ? 'ring-ink' : 'ring-transparent',
            )}
          >
            <UserAvatar user={user} size={24} />
            {dot}
          </span>
          Me
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center rounded-full p-0.5 transition-colors hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-label={label}
          aria-expanded={menuOpen}
          aria-controls={menuOpen ? panelId : undefined}
        >
          <span className="relative">
            <UserAvatar user={user} size={36} />
            {dot}
          </span>
        </button>
      )}

      {menuOpen && (
        <div
          ref={panelRef}
          id={panelId}
          className={cn(
            'absolute right-0 z-40 w-60 overflow-hidden rounded-tile bg-surface shadow-soft ring-1 ring-line',
            variant === 'tab' ? 'bottom-full mb-4' : 'top-full mt-2',
          )}
        >
          <div className="border-b border-line px-4 py-3">
            <span className="block truncate text-sm font-semibold leading-normal text-ink">
              {user.display_name || user.username}
            </span>
            <span className="block truncate text-xs leading-normal text-muted">
              @{user.username}
            </span>
          </div>
          <Link
            href={`/u/${encodeURIComponent(user.username)}`}
            onClick={close}
            className={itemClass}
          >
            <UserRound size={14} />
            Profile
          </Link>
          <Link href="/me/moments" onClick={close} className={itemClass}>
            <ImageIcon size={14} />
            รูปของฉัน
          </Link>
          <Link href="/blocks" onClick={close} className={itemClass}>
            <Ban size={14} />
            คนที่ block
          </Link>
          <Link href="/invites" onClick={close} className={itemClass}>
            <Inbox size={14} />
            Invites
            {inviteCount > 0 && (
              <span className="ml-auto rounded-full bg-danger px-1.5 text-xs font-semibold leading-normal text-white">
                {inviteCount}
              </span>
            )}
          </Link>
          <div className="border-t border-line" />
          <button
            type="button"
            onClick={() => {
              close()
              logout()
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm leading-normal text-danger transition-colors hover:bg-danger/5 focus-visible:bg-danger/5 focus-visible:outline-none"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
