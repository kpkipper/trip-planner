'use client'

import { useEffect, useState } from 'react'

import { usePathname } from 'next/navigation'

import { listFollowRequests } from '@/api/follows'
import { useAuth } from '@/contexts/auth-context'
import { FOLLOW_REQUESTS_CHANGED } from '@/lib/follow-requests'

// Pending follow-request count for the nav badge. Refreshed on navigation and whenever the
// requests page fires FOLLOW_REQUESTS_CHANGED. Errors give 0 and never redirect to login.
export function usePendingRequests(): number {
  const pathname = usePathname()
  const { status } = useAuth()
  const [pending, setPending] = useState(0)
  const [refreshTick, setRefreshTick] = useState(0)

  // The requests page answers requests without changing the path: it fires this event.
  useEffect(() => {
    const onChanged = () => setRefreshTick((n) => n + 1)
    window.addEventListener(FOLLOW_REQUESTS_CHANGED, onChanged)
    return () => window.removeEventListener(FOLLOW_REQUESTS_CHANGED, onChanged)
  }, [])

  useEffect(() => {
    if (status !== 'authed') return
    let cancelled = false
    listFollowRequests({ skipAuthRedirect: true })
      .then(({ count }) => {
        if (!cancelled) setPending(count)
      })
      .catch(() => {
        if (!cancelled) setPending(0)
      })
    return () => {
      cancelled = true
    }
  }, [status, pathname, refreshTick])

  // Not authed: nothing pending (a stale count from a previous session must not show).
  return status === 'authed' ? pending : 0
}
