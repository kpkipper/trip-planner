'use client'

import { useEffect, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import { Edit2, FileJson, FileText, MoreVertical, Trash2 } from 'lucide-react'

import { exportJSON, exportPDF } from './export-utils'

import type { Trip } from '@/types/trip'

interface Props {
  slug: string
  trip: Trip
  onDelete: () => void
}

export default function TripActionMenu({ slug, trip, onDelete }: Props) {
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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="p-2 rounded-lg border border-gray-300 dark:border-[#3c3c4a] hover:bg-gray-50 dark:hover:bg-[#363640] text-gray-600 dark:text-gray-400 transition-colors"
        aria-label="Actions"
      >
        <MoreVertical size={16} />
      </button>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-[#313139] border border-gray-200 dark:border-[#3c3c4a] rounded-xl shadow-lg dark:shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden z-20">
          <button
            onClick={() => {
              router.push(`/plans/${slug}/edit`)
              close()
            }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3c3c4a] transition-colors"
          >
            <Edit2 size={14} />
            Edit
          </button>
          <div className="border-t border-gray-100 dark:border-[#3c3c4a]" />
          <button
            onClick={() => {
              exportJSON(trip)
              close()
            }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3c3c4a] transition-colors"
          >
            <FileJson size={14} />
            Export as JSON
          </button>
          <button
            onClick={() => {
              exportPDF(trip)
              close()
            }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#3c3c4a] transition-colors"
          >
            <FileText size={14} />
            Export as PDF
          </button>
          <div className="border-t border-gray-100 dark:border-[#3c3c4a]" />
          <button
            onClick={() => {
              onDelete()
              close()
            }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
