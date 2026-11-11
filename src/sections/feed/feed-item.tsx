import UserAvatar from '@/components/user-avatar'
import { feedCover } from '@/lib/feed-cover'
import { feedText, relativeThai } from '@/lib/feed-text'

import type { FeedItem as FeedItemType } from '@/api/feed/type'

export default function FeedItem({ item, now }: { item: FeedItemType; now: Date }) {
  const { parts } = feedText(item)
  const cover = feedCover(item)
  const tripHref = `/plans/${encodeURIComponent(item.trip.slug)}`

  return (
    <li className="overflow-hidden rounded-card bg-surface shadow-soft">
      <a
        href={tripHref}
        aria-label={
          cover.kind === 'photo'
            ? `ดูรูปในทริป ${item.trip.destination}`
            : item.trip.title || item.trip.destination
        }
        // The focus ring sits on an overlay: an inset ring on the link itself is painted over
        // by the full-size cover.
        className="relative block h-[150px] bg-chip after:pointer-events-none after:absolute after:inset-0 after:rounded-t-card focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-accent sm:h-[220px]"
      >
        {cover.kind === 'gradient' ? (
          <span
            aria-hidden
            className="block h-full w-full"
            style={{ backgroundImage: cover.background }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- static export, signed/remote media
          <img
            src={cover.src}
            alt=""
            referrerPolicy="no-referrer"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        )}
        {cover.kind === 'photo' && cover.extras.length > 0 && (
          <span className="absolute bottom-3 right-3 flex gap-1.5">
            {cover.extras.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- static export, signed media URL
              <img
                key={i}
                src={src}
                alt=""
                referrerPolicy="no-referrer"
                loading="lazy"
                className="h-10 w-10 rounded-tile object-cover bg-chip ring-2 ring-surface"
              />
            ))}
          </span>
        )}
      </a>
      <div className="flex items-start gap-3 px-4 pb-4 pt-3">
        {/* Positioned (no z-index) so it paints over the cover without a stacking context. */}
        <span className="relative -mt-8 shrink-0 rounded-full ring-[3px] ring-surface">
          <UserAvatar user={item.actor} size={40} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="break-words text-[15px] leading-normal text-ink-2">
            {parts.map((p, i) => {
              const cls = p.strong ? 'font-semibold text-ink' : undefined
              return p.href ? (
                <a
                  key={i}
                  href={p.href}
                  className={`${cls ?? ''} rounded hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent`}
                >
                  {p.text}
                </a>
              ) : (
                <span key={i} className={cls}>
                  {p.text}
                </span>
              )
            })}
          </p>
          <p className="mt-0.5 text-xs leading-normal text-muted">{relativeThai(item.at, now)}</p>
        </div>
      </div>
    </li>
  )
}
