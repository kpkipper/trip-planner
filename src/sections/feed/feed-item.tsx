import UserAvatar from '@/components/user-avatar'
import { feedText, relativeThai } from '@/lib/feed-text'
import { safeHttpsUrl, safeMediaUrl } from '@/lib/safe-url'

import type { FeedItem as FeedItemType } from '@/api/feed/type'

const MAX_THUMBS = 4

export default function FeedItem({ item, now }: { item: FeedItemType; now: Date }) {
  const { parts } = feedText(item)
  const thumbs = (item.moments?.thumbs ?? [])
    .map(safeMediaUrl)
    .filter((u): u is string => !!u)
    .slice(0, MAX_THUMBS)
  const cover = item.type === 'moments_added' ? null : safeHttpsUrl(item.trip.cover_url)

  return (
    <li className="flex gap-3 rounded-tile bg-surface p-3 shadow-soft">
      <UserAvatar user={item.actor} size={40} />
      <div className="min-w-0 flex-1">
        <p className="text-sm text-gray-800">
          {parts.map((p, i) => {
            const cls = p.strong ? 'font-semibold' : undefined
            return p.href ? (
              <a key={i} href={p.href} className={`${cls ?? ''} hover:underline`}>
                {p.text}
              </a>
            ) : (
              <span key={i} className={cls}>
                {p.text}
              </span>
            )
          })}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{relativeThai(item.at, now)}</p>
        {thumbs.length > 0 && (
          <a
            href={`/plans/${encodeURIComponent(item.trip.slug)}`}
            className="mt-2 flex gap-1.5"
            aria-label={`ดูรูปในทริป ${item.trip.destination}`}
          >
            {thumbs.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- static export, signed media URL
              <img
                key={i}
                src={src}
                alt=""
                referrerPolicy="no-referrer"
                className="h-16 w-16 rounded-md object-cover bg-gray-100"
              />
            ))}
          </a>
        )}
        {cover && (
          <a href={`/plans/${encodeURIComponent(item.trip.slug)}`} className="block mt-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- static export, remote cover */}
            <img
              src={cover}
              alt=""
              referrerPolicy="no-referrer"
              className="h-32 w-full rounded-lg object-cover bg-gray-100"
            />
          </a>
        )}
      </div>
    </li>
  )
}
