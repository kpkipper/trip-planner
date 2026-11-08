'use client'

import { useEffect, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import { Edit2, FileJson, FileText, LogOut, MoreVertical, Trash2 } from 'lucide-react'

import { tripActions } from '@/lib/trip-roles'

import { exportJSON, exportPDF } from './export-utils'

import type { Trip } from '@/types/trip'

interface Props {
  slug: string
  trip: Trip
  onDelete: () => void
  onLeave: () => void
}

export default function TripActionMenu({ slug, trip, onDelete, onLeave }: Props) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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
  if (!actions.edit && !actions.delete && !actions.leave && !actions.export) return null

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors"
        aria-label="Actions"
      >
        <MoreVertical size={16} />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-20">
          {actions.edit && (
            <button
              onClick={() => {
                router.push(`/plans/${slug}/edit`)
                close()
              }}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit2 size={14} />
              Edit
            </button>
          )}
          {actions.export && (
            <>
              {actions.edit && <div className="border-t border-gray-100" />}
              <button
                onClick={() => {
                  exportJSON(trip)
                  close()
                }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileJson size={14} />
                Export as JSON
              </button>
              <button
                onClick={() => {
                  exportPDF(trip)
                  close()
                }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <FileText size={14} />
                Export as PDF
              </button>
            </>
          )}
          {actions.leave && (
            <>
              <div className="border-t border-gray-100" />
              <button
                onClick={() => {
                  onLeave()
                  close()
                }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                Leave trip
              </button>
            </>
          )}
          {actions.delete && (
            <>
              <div className="border-t border-gray-100" />
              <button
                onClick={() => {
                  onDelete()
                  close()
                }}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
