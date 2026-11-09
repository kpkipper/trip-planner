'use client'

import { useRef, useState } from 'react'

import { createReport } from '@/api/safety'
import { useToast } from '@/contexts/toast-context'
import { errorSummary } from '@/lib/error-summary'
import { MAX_NOTE, REPORT_REASONS, reportErrorMessage, validateReport } from '@/lib/report-form'
import { useModalA11y } from '@/lib/use-modal-a11y'

import type { ReportReason, ReportTargetType } from '@/api/safety/type'

interface Props {
  targetType: ReportTargetType
  target: string
  onClose: () => void
}

// Mount it only while open: the form state starts fresh each time.
export default function ReportDialog({ targetType, target, onClose }: Props) {
  const { showToast } = useToast()
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  useModalA11y(dialogRef, { open: true, onClose, canClose: !busy })

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
        className="relative w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h2 className="mb-3 text-base font-semibold text-gray-800">รายงาน</h2>
        <fieldset className="space-y-1.5">
          <legend className="sr-only">เหตุผล</legend>
          {REPORT_REASONS.map((r) => (
            <label key={r.value} className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="radio"
                name="report-reason"
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
        <label className="mt-3 block text-sm text-gray-600" htmlFor="report-note">
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
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#16aef2]"
        />
        <p className="text-right text-xs text-gray-400">
          {[...note].length}/{MAX_NOTE}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            ส่งรายงาน
          </button>
        </div>
      </div>
    </div>
  )
}
