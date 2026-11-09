'use client'

import { useState } from 'react'

import { Play } from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { momentControls } from '@/lib/moment-controls'
import { formatDuration } from '@/lib/moments-by-day'
import { safeMediaUrl } from '@/lib/safe-url'

import MomentLightbox from './moment-lightbox'
import MomentUploader from './moment-uploader'

import type { MomentView } from '@/api/moments/type'
import type { TripSettings } from '@/types/trip'

interface Props {
  slug: string
  dayId: string
  planId?: string
  moments: MomentView[]
  role: string | undefined
  settings: TripSettings | undefined
  reload: () => void
  onMediaError: () => void
  onReport?: (m: MomentView) => void
}

// Thumbnails of one day's (or one plan's) moments, plus the post button for those allowed.
export default function MomentsGallery({
  slug,
  dayId,
  planId,
  moments,
  role,
  settings,
  reload,
  onMediaError,
  onReport,
}: Props) {
  const { user } = useAuth()
  const [open, setOpen] = useState<number | null>(null)
  const { canPost } = momentControls(role, settings, user?.username)

  if (moments.length === 0 && !canPost) return null

  return (
    <div className="mt-2">
      {moments.length > 0 && (
        <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
          {moments.map((m, i) => {
            const thumb = safeMediaUrl(m.thumb_url)
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setOpen(i)}
                  aria-label={m.kind === 'video' ? 'เปิดวิดีโอ' : 'เปิดรูป'}
                  className="relative block aspect-square w-full overflow-hidden rounded-lg bg-gray-100"
                >
                  {thumb && (
                    // eslint-disable-next-line @next/next/no-img-element -- static export, signed remote URL
                    <img
                      src={thumb}
                      alt={m.caption}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={onMediaError}
                      className="h-full w-full object-cover"
                    />
                  )}
                  {m.kind === 'video' && (
                    <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1 text-xs text-white">
                      <Play size={12} fill="currentColor" />
                      {formatDuration(m.duration_ms)}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {canPost && (
        <div className={moments.length > 0 ? 'mt-2' : ''}>
          <MomentUploader slug={slug} dayId={dayId} planId={planId} onDone={reload} />
        </div>
      )}

      {open !== null && (
        <MomentLightbox
          moments={moments}
          index={Math.min(open, moments.length - 1)}
          onIndexChange={setOpen}
          onClose={() => setOpen(null)}
          onChanged={reload}
          onMediaError={onMediaError}
          role={role}
          settings={settings}
          currentUsername={user?.username}
          onReport={onReport}
        />
      )}
    </div>
  )
}
