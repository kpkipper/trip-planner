'use client'

import { type ReactNode, useRef } from 'react'

import { Camera } from 'lucide-react'

import { MAX_FILES } from '@/lib/moment-upload'
import { buttonClass } from '@/lib/ui-classes'

import { useUploads } from './upload-context'

import type { UploadItem } from '@/lib/moment-upload'

interface Target {
  slug: string
  dayId: string
  planId?: string
}

const ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime'

// The file picker of one day/plan uploader. `input` must be rendered once; `pick()` opens it,
// so any trigger (the button below, the story row's add-ring) can start an upload.
export function useMomentPicker({ slug, dayId, planId }: Target) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { items, busy, store, key } = useUploads(dayId, planId)

  // The upload runs in the trip-level store, so it outlives this component (day tab switch).
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0 || busy) return
    void store.start({ slug, dayId, planId }, files)
  }

  const input: ReactNode = (
    <input
      ref={inputRef}
      type="file"
      multiple
      accept={ACCEPT}
      onChange={onPick}
      className="hidden"
      aria-label={`เลือกรูป (ไม่เกิน ${MAX_FILES} ไฟล์)`}
    />
  )

  return {
    pick: () => inputRef.current?.click(),
    input,
    items,
    busy,
    dismiss: () => store.dismiss(key),
  }
}

export function UploadProgress({
  items,
  busy,
  onDismiss,
}: {
  items: UploadItem[]
  busy: boolean
  onDismiss: () => void
}) {
  if (items.length === 0) return null
  const failed = items.filter((i) => i.state === 'error')
  return (
    <ul className="mt-2 space-y-1.5" aria-live="polite">
      {items.map((it, i) => (
        <li key={i} className="text-xs leading-normal text-ink-2">
          <div className="flex items-center justify-between gap-2">
            <span className="min-w-0 truncate">{it.name}</span>
            <span className={it.state === 'error' ? 'text-danger' : 'text-muted'}>
              {it.state === 'queued' && 'รอคิว'}
              {it.state === 'uploading' && `${Math.round(it.progress * 100)}%`}
              {it.state === 'processing' && 'กำลังประมวลผล…'}
              {it.state === 'done' && 'เสร็จแล้ว'}
              {it.state === 'error' && (it.error ?? 'อัปโหลดไม่สำเร็จ')}
            </span>
          </div>
          {(it.state === 'uploading' || it.state === 'queued') && (
            <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-chip">
              <div
                className="h-full bg-accent transition-all"
                style={{ width: `${Math.round(it.progress * 100)}%` }}
              />
            </div>
          )}
        </li>
      ))}
      {!busy && (
        <li>
          <button
            type="button"
            onClick={onDismiss}
            className="rounded text-xs leading-normal text-muted underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {failed.length > 0 ? 'ปิด' : 'ซ่อนรายการ'}
          </button>
        </li>
      )}
    </ul>
  )
}

export default function MomentUploader(props: Target) {
  const { pick, input, items, busy, dismiss } = useMomentPicker(props)

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={pick}
        className={buttonClass('secondary', 'sm')}
      >
        <Camera size={14} />
        {busy ? 'กำลังอัปโหลด…' : 'อัปโหลดรูป'}
      </button>
      {input}
      <UploadProgress items={items} busy={busy} onDismiss={dismiss} />
    </div>
  )
}
