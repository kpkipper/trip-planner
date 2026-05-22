'use client'

import React, { useState } from 'react'

import { Menu, Moon, PlaneTakeoff, Sun } from 'lucide-react'

import { useTheme } from '@/contexts/theme-context'

import Sidebar from './sidebar'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#1a1a22]">
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
        <div className="md:hidden flex items-center px-4 py-3 border-b border-gray-200 dark:border-[#3c3c4a] bg-white dark:bg-[#26262e] dark:shadow-[0_2px_12px_rgba(0,0,0,0.4)]">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#3c3c4a] text-gray-500 dark:text-gray-400"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 font-bold text-[#0163a4] flex items-center gap-1.5 text-sm flex-1">
            <PlaneTakeoff size={16} />
            Trip Planner
          </span>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-[#3c3c4a] text-gray-500 dark:text-gray-400"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

        {children}
      </main>
    </div>
  )
}
