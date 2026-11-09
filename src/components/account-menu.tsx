'use client'

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { ImageIcon, Inbox, LogIn, LogOut, UserRound } from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { useInvites } from '@/contexts/invites-context'
import { loginPath } from '@/lib/safe-next'

import UserAvatar from './user-avatar'

interface Props {
  collapsed: boolean
}

const itemClass =
  'flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors'

export default function AccountMenu({ collapsed }: Props) {
  const pathname = usePathname()
  const { status, user, logout } = useAuth()
  const { invites } = useInvites()
  const inviteCount = invites.length
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  if (status === 'loading') return <div className="h-[37px]" />

  if (status === 'anon' || !user) {
    return (
      <Link
        href={loginPath(pathname)}
        className={`flex items-center gap-2 w-full rounded-lg px-3 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium ${
          collapsed ? 'justify-center px-2' : ''
        }`}
        aria-label="Log in"
      >
        <LogIn size={18} className="flex-shrink-0" />
        {!collapsed && 'Log in'}
      </Link>
    )
  }

  const close = () => setMenuOpen(false)

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className={`flex items-center gap-2.5 w-full rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors ${
          collapsed ? 'justify-center' : ''
        }`}
        aria-label={
          inviteCount > 0 ? `Account menu, ${inviteCount} pending invites` : 'Account menu'
        }
        aria-expanded={menuOpen}
      >
        <span className="relative flex-shrink-0">
          <UserAvatar user={user} size={28} />
          {inviteCount > 0 && (
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </span>
        {!collapsed && (
          <span className="flex-1 min-w-0 text-left">
            <span className="block text-sm font-medium text-gray-700 truncate">
              {user.display_name || user.username}
            </span>
            <span className="block text-xs text-gray-400 truncate">@{user.username}</span>
          </span>
        )}
      </button>

      {menuOpen && (
        <div
          className={`absolute bottom-full mb-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-30 ${
            collapsed ? 'left-0' : 'left-0 right-0 w-auto'
          }`}
        >
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
          <Link href="/invites" onClick={close} className={itemClass}>
            <Inbox size={14} />
            Invites
            {inviteCount > 0 && (
              <span className="ml-auto rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                {inviteCount}
              </span>
            )}
          </Link>
          <div className="border-t border-gray-100" />
          <button
            onClick={() => {
              close()
              logout()
            }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}
