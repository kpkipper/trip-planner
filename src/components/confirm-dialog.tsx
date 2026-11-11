'use client'

import React, { useRef } from 'react'

import { AlertTriangle } from 'lucide-react'

import { buttonClass } from '@/lib/ui-classes'
import { useModalA11y } from '@/lib/use-modal-a11y'

import type { RefObject } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
  // Focused on close when the opener is gone (e.g. it was a menu item).
  returnFocus?: RefObject<HTMLElement | null>
}

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  returnFocus,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  // Escape cancels, Tab stays inside, focus returns on close.
  useModalA11y(panelRef, { open, onClose: onCancel, returnFocus })
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-sm rounded-card bg-surface p-6 shadow-soft"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger/10">
            <AlertTriangle size={18} className="text-danger" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-semibold leading-normal tracking-tight text-ink">{title}</h2>
            <p className="mt-1 text-sm leading-normal text-muted">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className={buttonClass('secondary', 'md')}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={buttonClass('danger', 'md')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
