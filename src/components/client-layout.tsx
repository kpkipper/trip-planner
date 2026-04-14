'use client'

import React, { useState } from 'react'
import { Menu, PlaneTakeoff } from 'lucide-react'
import Sidebar from './sidebar'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-col flex-shrink-0 h-full">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      </div>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileOpen(false)} />
          <div className="relative w-64 h-full">
            <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center px-4 py-3 border-b border-gray-200 bg-white">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 font-bold text-[#0163a4] flex items-center gap-1.5 text-sm">
            <PlaneTakeoff size={16} />
            Trip Planner
          </span>
        </div>

        {children}
      </main>
    </div>
  )
}
