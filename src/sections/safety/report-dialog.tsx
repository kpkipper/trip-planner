'use client'

import { useRef, useState } from 'react'

import { createReport } from '@/api/safety'
import { useToast } from '@/contexts/toast-context'
import { errorSummary } from '@/lib/error-summary'
import { MAX_NOTE, REPORT_REASONS, reportErrorMessage, validateReport } from '@/lib/report-form'
import { buttonClass, cn, fieldClass } from '@/lib/ui-classes'
import { useModalA11y } from '@/lib/use-modal-a11y'

import type { ReportReason, ReportTargetType } from '@/api/safety/type'
import type { RefObject } from 'react'

interface Props {
  targetType: ReportTargetType
  target: string
  onClose: () => void
  // Focused on close when the opener is gone (e.g. it was a menu item).
  returnFocus?: RefObject<HTMLElement | null>
}

// Mount it only while open: the form state starts fresh each time.
export default function ReportDialog({ targetType, target, onClose, returnFocus }: Props) {
  const { showToast } = useToast()
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  useModalA11y(dialogRef, { open: true, onClose, canClose: !busy, returnFocus })

  const submit = async () => {
    if (busy) return
    const invalid = validateReport({ reason, note })
    if (invalid || !reason) {
      setError(invalid)
      return
    }
    setBusy(true)
    try {
      // 201 (new) and 200 (duplicate) are both success.
      await createReport({
        target_type: targetType,
        target,
        reason,
        note: note.trim() || undefined,
      })
      showToast('ส่งรายงานแล้ว ขอบคุณ')
      onClose()
    } catch (err) {
      showToast(reportErrorMessage(err), 'error')
      console.error('Failed to send report:', errorSummary(err))
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={() => !busy && onClose()} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="รายงาน"
        className="relative w-full max-w-sm rounded-card bg-surface p-6 shadow-soft"
      >
        <h2 className="mb-3 text-lg font-semibold leading-normal tracking-tight text-ink">รายงาน</h2>
        <fieldset className="-mx-2 space-y-0.5">
          <legend className="sr-only">เหตุผล</legend>
          {REPORT_REASONS.map((r) => (
            <label
              key={r.value}
              className="flex cursor-pointer items-center gap-3 rounded-tile px-2 py-2 text-sm leading-normal text-ink-2 hover:bg-chip has-[:checked]:bg-chip has-[:checked]:text-ink has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
            >
              <input
                type="radio"
                name="report-reason"
                className="h-4 w-4 shrink-0 accent-primary focus:outline-none"
                value={r.value}
                checked={reason === r.value}
                onChange={() => {
                  setReason(r.value)
                  setError(null)
                }}
              />
              {r.label}
            </label>
          ))}
        </fieldset>
        <label className="mt-4 block text-[13px] font-medium leading-normal text-muted" htmlFor="report-note">
          รายละเอียดเพิ่มเติม (ไม่บังคับ)
        </label>
        <textarea
          id="report-note"
          value={note}
          onChange={(e) => {
            setNote(e.target.value)
            setError(null)
          }}
          rows={3}
          className={cn(fieldClass, 'mt-1.5 w-full resize-none')}
        />
        <p className="mt-1 text-right text-xs leading-normal text-muted">
          {[...note].length}/{MAX_NOTE}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-sm leading-normal text-danger">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className={buttonClass('ghost', 'md')}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className={buttonClass('primary', 'md')}
          >
            ส่งรายงาน
          </button>
        </div>
      </div>
    </div>
  )
}
