'use client'

import { useRef } from 'react'

import { Camera } from 'lucide-react'

import { MAX_FILES } from '@/lib/moment-upload'
import { buttonClass } from '@/lib/ui-classes'

import { useUploads } from './upload-context'

interface Props {
  slug: string
  dayId: string
  planId?: string
}

const ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime'

export default function MomentUploader({ slug, dayId, planId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { items, busy, store, key } = useUploads(dayId, planId)

  // The upload runs in the trip-level store, so it outlives this component (day tab switch).
  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0 || busy) return
    void store.start({ slug, dayId, planId }, files)
  }

  const failed = items.filter((i) => i.state === 'error')

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className={buttonClass('secondary', 'sm')}
      >
        <Camera size={14} />
        {busy ? 'กำลังอัปโหลด…' : 'อัปโหลดรูป'}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        onChange={onPick}
        className="hidden"
        aria-label={`เลือกรูป (ไม่เกิน ${MAX_FILES} ไฟล์)`}
      />

      {items.length > 0 && (
        <ul className="mt-2 space-y-1.5" aria-live="polite">
          {items.map((it, i) => (
            <li key={i} className="text-xs text-gray-600">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate">{it.name}</span>
                <span className={it.state === 'error' ? 'text-red-500' : 'text-gray-500'}>
                  {it.state === 'queued' && 'รอคิว'}
                  {it.state === 'uploading' && `${Math.round(it.progress * 100)}%`}
                  {it.state === 'processing' && 'กำลังประมวลผล…'}
                  {it.state === 'done' && 'เสร็จแล้ว'}
                  {it.state === 'error' && (it.error ?? 'อัปโหลดไม่สำเร็จ')}
                </span>
              </div>
              {(it.state === 'uploading' || it.state === 'queued') && (
                <div className="mt-0.5 h-1 overflow-hidden rounded bg-gray-100">
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
                onClick={() => store.dismiss(key)}
                className="text-xs text-gray-500 underline"
              >
                {failed.length > 0 ? 'ปิด' : 'ซ่อนรายการ'}
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
