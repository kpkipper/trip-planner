'use client'

import { useEffect, useRef, useState } from 'react'

import { ChevronLeft, ChevronRight, Flag, Pencil, Trash2, X } from 'lucide-react'

import { deleteMoment, updateCaption } from '@/api/moments'
import ConfirmDialog from '@/components/confirm-dialog'
import { useToast } from '@/contexts/toast-context'
import { errorSummary } from '@/lib/error-summary'
import { momentControls } from '@/lib/moment-controls'
import { safeMediaUrl } from '@/lib/safe-url'

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
  // Report handler; the button shows only when given and the viewer is not the uploader.
  onReport?: (m: MomentView) => void
  // Keyboard shortcuts do nothing while true (e.g. the report dialog is open).
  suspended?: boolean
}

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
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)
  const m = moments[index]

  const go = (delta: number) => {
    if (moments.length < 2) return
    setEditing(false)
    onIndexChange((index + delta + moments.length) % moments.length)
  }

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (suspended || confirmOpen || editing) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'ArrowRight') go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // The list shrank (deleted / reloaded): close when nothing is left.
  useEffect(() => {
    if (!m) onClose()
  }, [m, onClose])
  if (!m) return null

  const controls = momentControls(role, settings, currentUsername, m)
  const src = safeMediaUrl(m.url)
  const poster = safeMediaUrl(m.thumb_url) ?? undefined

  const remove = async () => {
    setConfirmOpen(false)
    setBusy(true)
    try {
      await deleteMoment(m.id)
      showToast('ลบรูปแล้ว')
      onRemoved?.(m.id)
      onChanged()
      if (moments.length > 1) onIndexChange(Math.min(index, moments.length - 2))
    } catch (err) {
      showToast('ลบรูปไม่สำเร็จ', 'error')
      console.error('Failed to delete moment:', errorSummary(err))
    } finally {
      setBusy(false)
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="รูปและวิดีโอ"
      className="fixed inset-0 z-40 flex flex-col bg-black/90"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm">
          {index + 1} / {moments.length}
          {m.uploader.display_name || m.uploader.username
            ? ` · ${m.uploader.display_name || m.uploader.username}`
            : ''}
        </span>
        <div className="flex items-center gap-1">
          {onReport && currentUsername && m.uploader.username !== currentUsername && (
            <button
              type="button"
              onClick={() => onReport(m)}
              aria-label="Report"
              className="rounded-full p-2 hover:bg-white/10"
            >
              <Flag size={18} />
            </button>
          )}
          {controls.canDelete && (
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmOpen(true)}
              aria-label="ลบรูป"
              className="rounded-full p-2 hover:bg-white/10 disabled:opacity-50"
            >
              <Trash2 size={18} />
            </button>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-full p-2 hover:bg-white/10"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
        {moments.length > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="ก่อนหน้า"
            className="absolute left-2 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
          >
            <ChevronLeft size={24} />
          </button>
        )}
        {!src ? (
          <p className="text-sm text-white/70">แสดงไฟล์นี้ไม่ได้</p>
        ) : m.kind === 'video' ? (
          <video
            key={m.id}
            src={src}
            poster={poster}
            controls
            playsInline
            preload="metadata"
            onError={onMediaError}
            className="max-h-full max-w-full"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- static export, signed remote URL
          <img
            key={m.id}
            src={src}
            alt={m.caption}
            referrerPolicy="no-referrer"
            onError={onMediaError}
            className="max-h-full max-w-full object-contain"
          />
        )}
        {moments.length > 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="ถัดไป"
            className="absolute right-2 z-10 rounded-full bg-black/40 p-2 text-white hover:bg-black/60"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      <div className="px-4 py-3 text-white">
        {editing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void saveCaption()
            }}
            className="flex gap-2"
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={500}
              aria-label="Caption"
              className="min-w-0 flex-1 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white outline-none focus:ring-2 focus:ring-[#16aef2]"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-[#0163a4] px-3 py-1.5 text-sm disabled:opacity-50"
            >
              บันทึก
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg px-3 py-1.5 text-sm hover:bg-white/10"
            >
              ยกเลิก
            </button>
          </form>
        ) : (
          <p className="flex items-center gap-2 text-sm">
            <span className="min-w-0 break-words">{m.caption}</span>
            {controls.canEditCaption && (
              <button
                type="button"
                onClick={() => {
                  setDraft(m.caption)
                  setEditing(true)
                }}
                aria-label="แก้ caption"
                className="shrink-0 rounded-full p-1.5 hover:bg-white/10"
              >
                <Pencil size={14} />
              </button>
            )}
          </p>
        )}
      </div>

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
