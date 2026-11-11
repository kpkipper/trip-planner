'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import {
  ChevronLeft,
  ChevronRight,
  Flag,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'

import { deleteMoment, updateCaption } from '@/api/moments'
import ConfirmDialog from '@/components/confirm-dialog'
import UserAvatar from '@/components/user-avatar'
import { useToast } from '@/contexts/toast-context'
import { errorSummary } from '@/lib/error-summary'
import { momentControls } from '@/lib/moment-controls'
import { safeMediaUrl } from '@/lib/safe-url'
import {
  HOLD_MS,
  isHold,
  isSwipeDown,
  PHOTO_DURATION_MS,
  segmentFill,
  stepStory,
  storyAge,
  tapSide,
} from '@/lib/story-player'
import { useModalA11y } from '@/lib/use-modal-a11y'

import type { MomentView } from '@/api/moments/type'
import type { TripSettings } from '@/types/trip'

interface Props {
  moments: MomentView[]
  index: number
  onIndexChange: (i: number) => void
  onClose: () => void
  // Reload the moments after a delete / caption edit.
  onChanged: () => void
  // Drop a deleted moment from the parent's list right away.
  onRemoved?: (id: string) => void
  onMediaError: () => void
  role: string | undefined
  settings: TripSettings | undefined
  currentUsername: string | undefined
  // Report handler; the menu item shows only when given and the viewer is not the uploader.
  onReport?: (m: MomentView) => void
  // Playback and keyboard shortcuts stop while true (e.g. the report dialog is open).
  suspended?: boolean
}

interface Press {
  at: number
  x: number
  y: number
}

// Full-screen story viewer: progress bars on top, tap left/right to move, hold to pause,
// swipe down to close. Photos run for PHOTO_DURATION_MS, clips for their own length.
export default function MomentLightbox({
  moments,
  index,
  onIndexChange,
  onClose,
  onChanged,
  onRemoved,
  onMediaError,
  role,
  settings,
  currentUsername,
  onReport,
  suspended = false,
}: Props) {
  const { showToast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [held, setHeld] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [muted, setMuted] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [progress, setProgress] = useState(0)
  // The photo is on screen: its timer may run.
  const [ready, setReady] = useState(false)
  // Bumped to restart the current story (back on the first one).
  const [restart, setRestart] = useState(0)
  // Ages ("3 ชม.") are measured from when the viewer opened.
  const [openedAt] = useState(() => Date.now())

  const rootRef = useRef<HTMLDivElement>(null)
  const pauseRef = useRef<HTMLButtonElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const pressRef = useRef<Press | null>(null)
  const holdTimer = useRef<number | null>(null)
  const mounted = useRef(true)
  // Photo timer state, kept out of render so the timer can decide when to move on.
  const elapsed = useRef(0)
  const timedKey = useRef('')
  const m = moments[index]

  const blocked = suspended || confirmOpen || editing || menuOpen || hidden || busy
  const paused = blocked || held || userPaused

  const go = useCallback(
    (delta: number) => {
      const next = stepStory(index, delta, moments.length)
      setMenuOpen(false)
      setEditing(false)
      if (next === 'close') onClose()
      else if (next === index) setRestart((r) => r + 1)
      else onIndexChange(next)
    },
    [index, moments.length, onClose, onIndexChange],
  )

  // Escape / focus trap / scroll lock. The trap pauses while the report dialog or the delete
  // prompt (which has its own trap) is on top; focus then returns to where it was.
  useModalA11y(rootRef, {
    open: true,
    active: !suspended && !confirmOpen,
    onClose,
    canClose: !editing,
    // Not the close button: Space on it would close the viewer straight away.
    initialFocus: pauseRef,
  })

  // A new story (or a restart) starts from zero; the media element remounts on the same key.
  // The URL is pinned per story so a reload (new signed URLs) does not restart a playing clip,
  // except after a failure, when the fresh URL gets a second try.
  const storyKey = `${m?.id}-${restart}`
  const [shown, setShown] = useState({ key: storyKey, url: m?.url, failed: false })
  if (shown.key !== storyKey) {
    setShown({ key: storyKey, url: m?.url, failed: false })
    setProgress(0)
    setReady(false)
  } else if (shown.failed && m && m.url !== shown.url) {
    setShown({ key: storyKey, url: m.url, failed: false })
    setReady(false)
  }
  const src = m ? safeMediaUrl(shown.url ?? m.url) : null
  // Failed or unusable media still shows for PHOTO_DURATION_MS, then moves on.
  const timed = !!m && (m.kind !== 'video' || !src || shown.failed)
  const timerReady = ready || !src || shown.failed

  // Stop when the tab is in the background, like Instagram.
  useEffect(() => {
    const onVis = () => setHidden(document.visibilityState === 'hidden')
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // Photo timer.
  useEffect(() => {
    if (timedKey.current !== storyKey) {
      timedKey.current = storyKey
      elapsed.current = 0
    }
    if (!timed || paused || !timerReady) return
    let last = performance.now()
    let frame = 0
    const tick = (now: number) => {
      elapsed.current += now - last
      last = now
      const p = elapsed.current / PHOTO_DURATION_MS
      setProgress(Math.min(1, p))
      if (p >= 1) go(1)
      else frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [storyKey, timed, paused, timerReady, go])

  // Clip playback follows the paused state; the bar follows the clip.
  useEffect(() => {
    const v = videoRef.current
    if (!m || timed || !v) return
    if (paused) {
      v.pause()
      return
    }
    let live = true
    v.muted = muted
    v.play().catch((err: unknown) => {
      // Only a blocked autoplay (sound before any interaction) falls back to muted. An
      // AbortError just means a pause or a story change came first.
      if (!live || (err as { name?: string } | null)?.name !== 'NotAllowedError') return
      v.muted = true
      setMuted(true)
      void v.play().catch(() => {
        if (live) setUserPaused(true)
      })
    })
    let frame = 0
    const tick = () => {
      const total = v.duration || m.duration_ms / 1000
      if (total > 0) setProgress(v.currentTime / total)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => {
      live = false
      cancelAnimationFrame(frame)
    }
  }, [m, timed, paused, muted, storyKey])

  // Load the next photo early so it appears without a blank frame.
  useEffect(() => {
    const next = moments[index + 1]
    if (!next || next.kind === 'video') return
    const src = safeMediaUrl(next.url)
    if (src) new Image().src = src
  }, [moments, index])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (suspended || confirmOpen || editing) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === ' ' && t?.tagName !== 'BUTTON') {
        e.preventDefault()
        setUserPaused((p) => !p)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, suspended, confirmOpen, editing])

  useEffect(
    () => () => {
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current)
    },
    [],
  )

  // The list shrank (deleted / reloaded): close when nothing is left.
  useEffect(() => {
    if (!m) onClose()
  }, [m, onClose])
  if (!m) return null

  const controls = momentControls(role, settings, currentUsername, m)
  const canReport = !!onReport && !!currentUsername && m.uploader.username !== currentUsername
  const hasMenu = canReport || controls.canDelete || controls.canEditCaption
  const poster = safeMediaUrl(m.thumb_url) ?? undefined
  const name = m.uploader.display_name || m.uploader.username

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !e.isPrimary) return
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current)
    pressRef.current = { at: performance.now(), x: e.clientX, y: e.clientY }
    holdTimer.current = window.setTimeout(() => setHeld(true), HOLD_MS)
  }

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const press = pressRef.current
    pressRef.current = null
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current)
    holdTimer.current = null
    setHeld(false)
    if (!press) return
    if (isSwipeDown(e.clientX - press.x, e.clientY - press.y)) {
      onClose()
      return
    }
    if (isHold(press.at, performance.now())) return
    // A tap beside the caption box keeps the draft instead of leaving the story.
    if (editing) return
    if (menuOpen) {
      setMenuOpen(false)
      return
    }
    const box = e.currentTarget.getBoundingClientRect()
    go(tapSide(e.clientX - box.left, box.width) === 'prev' ? -1 : 1)
  }

  const onPointerCancel = () => {
    pressRef.current = null
    if (holdTimer.current !== null) window.clearTimeout(holdTimer.current)
    holdTimer.current = null
    setHeld(false)
  }

  const remove = async () => {
    setConfirmOpen(false)
    setBusy(true)
    try {
      await deleteMoment(m.id)
      showToast('ลบรูปแล้ว')
      if (!mounted.current) return
      onRemoved?.(m.id)
      onChanged()
      if (moments.length > 1) onIndexChange(Math.min(index, moments.length - 2))
    } catch (err) {
      showToast('ลบรูปไม่สำเร็จ', 'error')
      console.error('Failed to delete moment:', errorSummary(err))
    } finally {
      if (mounted.current) setBusy(false)
    }
  }

  const saveCaption = async () => {
    setBusy(true)
    try {
      await updateCaption(m.id, draft.trim())
      setEditing(false)
      onChanged()
    } catch (err) {
      showToast('แก้ caption ไม่สำเร็จ', 'error')
      console.error('Failed to update caption:', errorSummary(err))
    } finally {
      setBusy(false)
    }
  }

  const mediaFailed = () => {
    setShown((s) => ({ ...s, failed: true }))
    onMediaError()
  }

  const iconBtn = 'rounded-full p-2 text-white hover:bg-white/10 disabled:opacity-50'

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label="Story"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black sm:bg-neutral-900"
    >
      {index > 0 && (
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="ก่อนหน้า"
          className="sr-only rounded-full bg-white/90 p-1.5 text-gray-900 hover:bg-white focus:not-sr-only focus:absolute focus:left-4 focus:z-10 sm:not-sr-only sm:absolute sm:left-4 sm:z-10"
        >
          <ChevronLeft size={22} />
        </button>
      )}

      <div className="relative h-full w-full overflow-hidden bg-black sm:h-[min(92dvh,calc(100vw*16/9))] sm:w-auto sm:aspect-[9/16] sm:rounded-xl">
        {/* Tap / hold / swipe area. Buttons in the bars above it stop their own events. */}
        <div
          className="absolute inset-0 flex touch-none items-center justify-center select-none"
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onPointerLeave={onPointerCancel}
          onContextMenu={(e) => e.preventDefault()}
        >
          {!src || shown.failed ? (
            <p className="text-sm text-white/70">แสดงไฟล์นี้ไม่ได้</p>
          ) : m.kind === 'video' ? (
            <video
              key={storyKey}
              ref={videoRef}
              src={src}
              poster={poster}
              playsInline
              preload="auto"
              onEnded={() => go(1)}
              onError={mediaFailed}
              className="max-h-full w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- static export, signed remote URL
            <img
              key={storyKey}
              src={src}
              alt={m.caption}
              draggable={false}
              referrerPolicy="no-referrer"
              onLoad={() => setReady(true)}
              onError={mediaFailed}
              className="max-h-full w-full object-contain"
            />
          )}
        </div>

        <div className="pointer-events-none absolute inset-x-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-2 pt-2 pb-6">
          <p className="sr-only" aria-live="polite">
            {index + 1} / {moments.length}
          </p>
          <div className="flex gap-1" aria-hidden="true">
            {moments.map((s, i) => (
              <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/35">
                <div
                  className="h-full bg-white"
                  style={{ width: `${segmentFill(i, index, progress) * 100}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 text-white">
              <UserAvatar user={m.uploader} size={32} />
              <span className="truncate text-sm font-semibold">{name}</span>
              <span className="shrink-0 text-sm text-white/70">
                {storyAge(m.created_at, openedAt)}
              </span>
            </div>
            <div className="pointer-events-auto flex items-center">
              <button
                ref={pauseRef}
                type="button"
                onClick={() => setUserPaused((p) => !p)}
                aria-label={userPaused ? 'เล่นต่อ' : 'หยุด'}
                className={iconBtn}
              >
                {userPaused ? <Play size={18} fill="currentColor" /> : <Pause size={18} fill="currentColor" />}
              </button>
              {m.kind === 'video' && (
                <button
                  type="button"
                  onClick={() => setMuted((v) => !v)}
                  aria-label={muted ? 'เปิดเสียง' : 'ปิดเสียง'}
                  className={iconBtn}
                >
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}
              {hasMenu && (
                <div className="relative">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setMenuOpen((o) => !o)}
                    aria-label="ตัวเลือก"
                    aria-expanded={menuOpen}
                    className={iconBtn}
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl bg-white py-1 text-sm text-gray-900 shadow-lg">
                      {controls.canEditCaption && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false)
                            setDraft(m.caption)
                            setEditing(true)
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                        >
                          <Pencil size={14} /> แก้ caption
                        </button>
                      )}
                      {controls.canDelete && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false)
                            setConfirmOpen(true)
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-gray-50"
                        >
                          <Trash2 size={14} /> ลบ
                        </button>
                      )}
                      {canReport && (
                        <button
                          type="button"
                          onClick={() => {
                            setMenuOpen(false)
                            onReport?.(m)
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-gray-50"
                        >
                          <Flag size={14} /> Report
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="ปิด"
                className={iconBtn}
              >
                <X size={22} />
              </button>
            </div>
          </div>
        </div>

        {(editing || m.caption) && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 pt-10 pb-5 text-white">
            {editing ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  void saveCaption()
                }}
                className="pointer-events-auto flex gap-2"
              >
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={500}
                  aria-label="Caption"
                  className="min-w-0 flex-1 rounded-full bg-white/15 px-4 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-white/60"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-full bg-white px-4 py-2 text-sm font-medium text-gray-900 disabled:opacity-50"
                >
                  บันทึก
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-full px-3 py-2 text-sm hover:bg-white/10"
                >
                  ยกเลิก
                </button>
              </form>
            ) : (
              <p className="text-sm break-words">{m.caption}</p>
            )}
          </div>
        )}
      </div>

      {index < moments.length - 1 && (
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="ถัดไป"
          className="sr-only rounded-full bg-white/90 p-1.5 text-gray-900 hover:bg-white focus:not-sr-only focus:absolute focus:right-4 focus:z-10 sm:not-sr-only sm:absolute sm:right-4 sm:z-10"
        >
          <ChevronRight size={22} />
        </button>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="ลบรูปนี้?"
        description="ลบแล้วกู้คืนไม่ได้"
        confirmLabel="ลบ"
        onConfirm={remove}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  )
}
