import Link from 'next/link'

import UserAvatar from '@/components/user-avatar'
import { cn } from '@/lib/ui-classes'

import { Card } from './card'

import type { PublicProfileType } from '@/api/journey/type'
import type { ComponentProps, ReactNode } from 'react'

// List pages (follow requests, followers, blocks, invites, members): rows inside one card,
// split by hairlines. Row actions are secondary/ghost pills; a page keeps one primary.

export function ListCard({ className, children, ...props }: ComponentProps<'ul'>) {
  return (
    <Card padding="" className="overflow-hidden">
      <ul className={cn('divide-y divide-line', className)} {...props}>
        {children}
      </ul>
    </Card>
  )
}

export const listRowClass = 'flex items-center gap-3 px-4 py-3 sm:px-5'

/** Empty or error state in the same card shape as a list. */
export function EmptyCard({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <Card padding="p-8" className={cn('text-center text-sm leading-normal text-muted', className)}>
      {children}
    </Card>
  )
}

/** Avatar plus name and @username, linking to the profile. Grows to fill the row. */
export function UserLink({ user }: { user: PublicProfileType }) {
  return (
    <>
      <UserAvatar user={user} size={40} />
      <Link
        href={`/u/${encodeURIComponent(user.username)}`}
        className="min-w-0 flex-1 rounded-tile hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="block truncate text-sm font-medium leading-normal text-ink">
          {user.display_name || user.username}
        </span>
        <span className="block truncate text-xs leading-normal text-muted">@{user.username}</span>
      </Link>
    </>
  )
}

/** Page heading used by the list pages. */
export function PageTitle({ children, as: Tag = 'h1' }: { children: ReactNode; as?: 'h1' | 'h2' }) {
  return (
    <Tag
      className={cn(
        'mb-4 font-semibold leading-snug tracking-tight text-ink',
        Tag === 'h1' ? 'text-[28px]' : 'text-xl',
      )}
    >
      {children}
    </Tag>
  )
}
