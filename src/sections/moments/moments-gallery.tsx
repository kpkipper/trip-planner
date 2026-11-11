'use client'

import { useState } from 'react'

import { Play, Plus } from 'lucide-react'

import { StoryRing } from '@/components/ui/story-ring'
import UserAvatar from '@/components/user-avatar'
import { useAuth } from '@/contexts/auth-context'
import { momentControls } from '@/lib/moment-controls'
import { formatDuration } from '@/lib/moments-by-day'
import { safeMediaUrl } from '@/lib/safe-url'
import { storyGroups } from '@/lib/story-groups'
import ReportDialog from '@/sections/safety/report-dialog'

import MomentLightbox from './moment-lightbox'
import MomentUploader, { UploadProgress, useMomentPicker } from './moment-uploader'

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
  // Day gallery: a story row (one ring per uploader, add-ring first) above the thumbnail grid.
  stories?: boolean
}

const RING = 68

// Thumbnails of one day's (or one plan's) moments, plus the post button for those allowed.
export default function MomentsGallery({
  slug,
  dayId,
  planId,
  moments: allMoments,
  role,
  settings,
  reload,
  onMediaError,
  stories = false,
}: Props) {
  const { user } = useAuth()
  const [open, setOpen] = useState<number | null>(null)
  const [reportId, setReportId] = useState<string | null>(null)
  // Deleted ids are hidden at once, even if the follow-up reload fails.
  const [removed, setRemoved] = useState<Set<string>>(() => new Set())
  const moments = removed.size ? allMoments.filter((m) => !removed.has(m.id)) : allMoments
  const { canPost } = momentControls(role, settings, user?.username)

  // Never leave a stale open index behind: an empty list or out-of-range index resets it, so
  // the lightbox cannot pop open later when moments arrive.
  const stale = open !== null && open >= moments.length
  if (stale) setOpen(null)

  if (moments.length === 0 && !canPost) return null

  const grid = moments.length > 0 && (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {moments.map((m, i) => {
        const thumb = safeMediaUrl(m.thumb_url)
        return (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => setOpen(i)}
              aria-label="เปิดดู story"
              className="relative block aspect-square w-full overflow-hidden rounded-tile bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
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
                <span className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-gradient-to-t from-black/60 to-transparent px-2 py-1 text-xs leading-normal text-white">
                  <Play size={12} fill="currentColor" />
                  {formatDuration(m.duration_ms)}
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className="mt-2">
      {stories ? (
        <StoryRow
          slug={slug}
          dayId={dayId}
          planId={planId}
          moments={moments}
          canPost={canPost}
          onOpen={setOpen}
        >
          {grid && (
            <>
              <h3 className="mt-5 mb-3 text-sm font-medium leading-normal text-muted">ทั้งหมด</h3>
              {grid}
            </>
          )}
        </StoryRow>
      ) : (
        <>
          {grid}
          {canPost && (
            <div className={moments.length > 0 ? 'mt-2' : ''}>
              <MomentUploader slug={slug} dayId={dayId} planId={planId} />
            </div>
          )}
        </>
      )}

      {open !== null && !stale && (
        <MomentLightbox
          moments={moments}
          index={open}
          onIndexChange={setOpen}
          onClose={() => setOpen(null)}
          onChanged={reload}
          onRemoved={(id) => setRemoved((s) => new Set(s).add(id))}
          onMediaError={onMediaError}
          role={role}
          settings={settings}
          currentUsername={user?.username}
          onReport={user ? (m) => setReportId(m.id) : undefined}
          suspended={reportId !== null}
        />
      )}

      {reportId && (
        <ReportDialog targetType="moment" target={reportId} onClose={() => setReportId(null)} />
      )}
    </div>
  )
}

// One ring per uploader; tapping opens the viewer at that uploader's first moment in `moments`
// (the same list the viewer gets). The add-ring opens the same file picker as MomentUploader,
// and its upload progress shows under the row.
function StoryRow({
  slug,
  dayId,
  planId,
  moments,
  canPost,
  onOpen,
  children,
}: {
  slug: string
  dayId: string
  planId?: string
  moments: MomentView[]
  canPost: boolean
  onOpen: (index: number) => void
  children: React.ReactNode
}) {
  const { pick, input, items, busy, dismiss } = useMomentPicker({ slug, dayId, planId })
  const groups = storyGroups(moments)
  return (
    <>
      <ul className="-mx-1 flex gap-3.5 overflow-x-auto px-1 pt-1 pb-1">
        {canPost && (
          <li className="shrink-0">
            <button
              type="button"
              disabled={busy}
              onClick={pick}
              className="flex flex-col items-center gap-1.5 rounded-tile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-60"
              style={{ width: RING }}
            >
              <span
                className="grid place-items-center rounded-full bg-chip text-ink"
                style={{ width: RING, height: RING }}
              >
                <Plus size={26} aria-hidden />
              </span>
              <span className="w-full truncate text-center text-xs leading-normal text-muted">
                {busy ? 'กำลังอัปโหลด…' : 'อัปโหลดรูป'}
              </span>
            </button>
          </li>
        )}
        {groups.map((g) => {
          const name = g.uploader.display_name || g.uploader.username
          return (
            <li key={g.uploader.username} className="shrink-0">
              <button
                type="button"
                onClick={() => onOpen(g.start)}
                aria-label={`เปิดดู story ของ ${name}`}
                className="flex flex-col items-center gap-1.5 rounded-tile focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                style={{ width: RING }}
              >
                <StoryRing size={RING}>
                  <UserAvatar user={g.uploader} size={RING - 12} />
                </StoryRing>
                <span className="w-full truncate text-center text-xs leading-normal text-muted">
                  {name}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {canPost && (
        <>
          {input}
          <UploadProgress items={items} busy={busy} onDismiss={dismiss} />
        </>
      )}
      {children}
    </>
  )
}
