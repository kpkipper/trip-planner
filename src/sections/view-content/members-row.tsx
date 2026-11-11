import UserAvatar from '@/components/user-avatar'

import type { Trip } from '@/types/trip'

const MAX_SHOWN = 8

// Side-card member list: owner first, then the other joined members (the API lists the owner
// among members), each with avatar, name and role.
export default function MembersRow({ trip }: { trip: Trip }) {
  const others = (trip.members ?? []).filter(
    (m) => m.status !== 'invited' && m.username !== trip.owner?.username,
  )
  const people = [...(trip.owner ? [{ ...trip.owner, role: 'owner' }] : []), ...others]
  if (people.length === 0) return null
  const hidden = people.length - MAX_SHOWN

  return (
    <section aria-label="Trip members">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-medium leading-normal text-muted">Members</h2>
        {people.length > 1 && (
          <span className="text-xs leading-normal text-muted">{people.length} people</span>
        )}
      </div>
      <ul>
        {people.slice(0, MAX_SHOWN).map((p) => (
          <li key={p.username} className="flex items-center gap-2.5 py-2 text-sm leading-normal">
            <UserAvatar
              user={{
                username: p.username,
                display_name: p.displayName,
                avatar_url: p.avatarUrl,
              }}
              size={32}
            />
            <span className="min-w-0 flex-1 truncate font-medium text-ink" title={p.username}>
              {p.displayName || p.username}
            </span>
            {p.role && <span className="shrink-0 text-xs text-muted">{p.role}</span>}
          </li>
        ))}
      </ul>
      {hidden > 0 && <p className="pt-1 text-xs leading-normal text-muted">+{hidden} more</p>}
    </section>
  )
}
