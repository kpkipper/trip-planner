'use client'

import { useEffect, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import { Edit2, FileJson, FileText, Flag, LogOut, MoreVertical, Trash2 } from 'lucide-react'

import { useAuth } from '@/contexts/auth-context'
import { tripActions } from '@/lib/trip-roles'
import { cn, menuItemClass } from '@/lib/ui-classes'
import ReportDialog from '@/sections/safety/report-dialog'

import { exportJSON, exportPDF } from './export-utils'

import type { Trip } from '@/types/trip'

interface Props {
  slug: string
  trip: Trip
  onDelete: () => void
  onLeave: () => void
  // `glass` for the trip hero (on the cover); `default` on white surfaces.
  variant?: 'default' | 'glass'
}

export default function TripActionMenu({
  slug,
  trip,
  onDelete,
  onLeave,
  variant = 'default',
}: Props) {
  const router = useRouter()
  const { user } = useAuth()
  const [reporting, setReporting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  // The menu items unmount when the report dialog opens, so it hands focus back to the trigger.
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const close = () => setMenuOpen(false)
  const actions = tripActions(trip.role, trip.redacted ?? false)
  const canReport = !!user && trip.role !== 'owner'
  if (!actions.edit && !actions.delete && !actions.leave && !actions.export && !canReport) {
    return null
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        ref={triggerRef}
        onClick={() => setMenuOpen((v) => !v)}
        aria-expanded={menuOpen}
        className={cn(
          'grid place-items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2',
          variant === 'glass'
            ? 'h-10 w-10 bg-black/30 text-white backdrop-blur-md hover:bg-black/45 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/40'
            : 'p-2 text-ink-2 bg-surface ring-1 ring-inset ring-line hover:bg-chip focus-visible:ring-accent',
        )}
        aria-label="Actions"
      >
        <MoreVertical size={variant === 'glass' ? 18 : 16} />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-surface rounded-tile shadow-soft ring-1 ring-line overflow-hidden z-20">
          {actions.edit && (
            <button
              onClick={() => {
                router.push(`/plans/${slug}/edit`)
                close()
              }}
              className={menuItemClass()}
            >
              <Edit2 size={14} />
              Edit
            </button>
          )}
          {actions.export && (
            <>
              {actions.edit && <div className="border-t border-line" />}
              <button
                onClick={() => {
                  exportJSON(trip)
                  close()
                }}
                className={menuItemClass()}
              >
                <FileJson size={14} />
                Export as JSON
              </button>
              <button
                onClick={() => {
                  exportPDF(trip)
                  close()
                }}
                className={menuItemClass()}
              >
                <FileText size={14} />
                Export as PDF
              </button>
            </>
          )}
          {canReport && (
            <>
              {(actions.edit || actions.export) && <div className="border-t border-line" />}
              <button
                onClick={() => {
                  setReporting(true)
                  close()
                }}
                className={menuItemClass()}
              >
                <Flag size={14} />
                Report
              </button>
            </>
          )}
          {actions.leave && (
            <>
              <div className="border-t border-line" />
              <button
                onClick={() => {
                  onLeave()
                  close()
                }}
                className={menuItemClass('danger')}
              >
                <LogOut size={14} />
                Leave trip
              </button>
            </>
          )}
          {actions.delete && (
            <>
              <div className="border-t border-line" />
              <button
                onClick={() => {
                  onDelete()
                  close()
                }}
                className={menuItemClass('danger')}
              >
                <Trash2 size={14} />
                Delete
              </button>
            </>
          )}
        </div>
      )}
      {reporting && (
        <ReportDialog
          targetType="journey"
          target={slug}
          onClose={() => setReporting(false)}
          returnFocus={triggerRef}
        />
      )}
    </div>
  )
}
