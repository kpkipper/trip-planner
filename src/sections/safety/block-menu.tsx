'use client'

import { useEffect, useRef, useState } from 'react'

import { Ban, Flag, MoreHorizontal } from 'lucide-react'

import { blockUser, unblockUser } from '@/api/safety'
import ConfirmDialog from '@/components/confirm-dialog'
import { useToast } from '@/contexts/toast-context'
import { errorSummary } from '@/lib/error-summary'

import ReportDialog from './report-dialog'

interface Props {
  username: string
  isBlocked: boolean
  // Called after a successful block / unblock (reload the profile).
  onChanged: () => void
}

const itemClass =
  'flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors'

export default function BlockMenu({ username, isBlocked, onChanged }: Props) {
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [busy, setBusy] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  // The menu items unmount when a dialog opens, so dialogs hand focus back to the trigger.
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const run = async (action: 'block' | 'unblock') => {
    setConfirmOpen(false)
    setOpen(false)
    if (busy) return
    setBusy(true)
    try {
      await (action === 'block' ? blockUser(username) : unblockUser(username))
      showToast(action === 'block' ? `Block @${username} แล้ว` : `เลิก block @${username} แล้ว`)
      onChanged()
    } catch (err) {
      showToast(action === 'block' ? 'Block ไม่สำเร็จ' : 'Unblock ไม่สำเร็จ', 'error')
      console.error(`Failed to ${action}:`, errorSummary(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="เมนู"
        aria-expanded={open}
        className="rounded-full bg-surface p-2 text-gray-600 ring-1 ring-inset ring-line transition-colors hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-tile bg-surface shadow-lg ring-1 ring-line">
          {isBlocked ? (
            <button type="button" className={itemClass} onClick={() => void run('unblock')}>
              <Ban size={14} />
              Unblock
            </button>
          ) : (
            <button
              type="button"
              className={itemClass}
              onClick={() => {
                setOpen(false)
                setConfirmOpen(true)
              }}
            >
              <Ban size={14} />
              Block
            </button>
          )}
          <button
            type="button"
            className={itemClass}
            onClick={() => {
              setOpen(false)
              setReporting(true)
            }}
          >
            <Flag size={14} />
            Report
          </button>
        </div>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title={`Block @${username}?`}
        description="เขาจะไม่เห็นทริปและโปรไฟล์ของคุณ และเลิก follow กันทั้งสองฝั่ง"
        confirmLabel="Block"
        onConfirm={() => void run('block')}
        onCancel={() => setConfirmOpen(false)}
        returnFocus={triggerRef}
      />
      {reporting && (
        <ReportDialog
          targetType="user"
          target={username}
          onClose={() => setReporting(false)}
          returnFocus={triggerRef}
        />
      )}
    </div>
  )
}
