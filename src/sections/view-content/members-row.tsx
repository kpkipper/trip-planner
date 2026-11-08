import UserAvatar from '@/components/user-avatar'

import type { Trip } from '@/types/trip'

// Owner first, then the other joined members (the API lists the owner among members).
export default function MembersRow({ trip }: { trip: Trip }) {
  const others = (trip.members ?? []).filter(
    (m) => m.status !== 'invited' && m.username !== trip.owner?.username,
  )
  const people = [...(trip.owner ? [trip.owner] : []), ...others]
  if (people.length === 0) return null

  return (
    <div className="flex items-center gap-2" aria-label="Trip members">
      <div className="flex -space-x-2">
        {people.slice(0, 6).map((p) => (
          <span
            key={p.username}
            title={p.displayName || p.username}
            className="rounded-full ring-2 ring-white"
          >
            <UserAvatar
              user={{
                username: p.username,
                display_name: p.displayName,
                avatar_url: p.avatarUrl,
              }}
              size={28}
            />
          </span>
        ))}
      </div>
      <span className="text-xs text-gray-500">
        {trip.owner ? `by ${trip.owner.displayName || trip.owner.username}` : ''}
        {others.length > 0 ? `${trip.owner ? ' · ' : ''}${others.length + 1} people` : ''}
      </span>
    </div>
  )
}
