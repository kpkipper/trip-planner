'use client'

import React from 'react'

import { usePendingRequests } from '@/lib/use-pending-requests'

import BottomTabs from './bottom-tabs'
import TopNav from './top-nav'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  // Fetched once here and shared by both navs (only one of them shows at a time).
  const pending = usePendingRequests()

  return (
    <>
      {/* Full-width scroll root. The bottom padding keeps content clear of the mobile tab bar. */}
      <main
        data-scroll-root
        className="h-dvh overflow-y-auto bg-bg pb-[calc(env(safe-area-inset-bottom)+5.5rem)] md:pb-0"
      >
        <TopNav pending={pending} />
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
      <BottomTabs pending={pending} />
    </>
  )
}
