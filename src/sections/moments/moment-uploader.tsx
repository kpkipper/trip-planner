'use client'

import { useRef, useState } from 'react'

import { Camera } from 'lucide-react'

import { MAX_FILES, uploadAll, type UploadItem } from '@/lib/moment-upload'

interface Props {
  slug: string
  dayId: string
  planId?: string
  // Called once the whole batch has finished (some files may have failed).
  onDone: () => void
}

const ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/quicktime'

export default function MomentUploader({ slug, dayId, planId, onDone }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [items, setItems] = useState<UploadItem[]>([])
  const [busy, setBusy] = useState(false)

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (files.length === 0 || busy) return
    setBusy(true)
    try {
      await uploadAll(files, { slug, dayId, planId }, undefined, setItems)
    } finally {
      setBusy(false)
      onDone()
    }
  }

  const failed = items.filter((i) => i.state === 'error')

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-lg border border-[#0163a4] px-3 py-1.5 text-sm font-medium text-[#0163a4] hover:bg-[#0163a4]/5 disabled:opacity-50"
      >
        <Camera size={14} />
        {busy ? 'กำลังอัปโหลด…' : 'แปะรูป/วิดีโอ'}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        onChange={onPick}
        className="hidden"
        aria-label={`เลือกรูปหรือวิดีโอ (ไม่เกิน ${MAX_FILES} ไฟล์)`}
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
                    className="h-full bg-[#0163a4] transition-all"
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
                onClick={() => setItems([])}
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
