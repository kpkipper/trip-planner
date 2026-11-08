'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { myInvites } from '@/api/members'
import { errorSummary } from '@/lib/error-summary'

import { useAuth } from './auth-context'

import type { InviteView } from '@/api/members/type'

interface InvitesContextValue {
  invites: InviteView[]
  loaded: boolean
  failed: boolean
  refresh: () => Promise<void>
}

const InvitesContext = createContext<InvitesContextValue | null>(null)

// Pending invitations of the logged-in user (the badge in the account menu + /invites).
export function InvitesProvider({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth()
  const userId = user?.id ?? null
  const [fetched, setFetched] = useState<{ userId: string; list: InviteView[] } | null>(null)
  const [failedFor, setFailedFor] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) return
    try {
      const list = await myInvites()
      setFetched({ userId, list })
      setFailedFor(null)
    } catch (err) {
      setFailedFor(userId)
      console.error('Failed to load invites:', errorSummary(err))
    }
  }, [userId])

  useEffect(() => {
    if (status !== 'authed') return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on login
    void refresh()
  }, [status, refresh])

  const current = fetched && fetched.userId === userId ? fetched.list : null
  const failed = failedFor !== null && failedFor === userId
  const value = useMemo(
    // On failure the list is hidden (no badge) and the request counts as settled.
    () => ({
      invites: failed ? [] : (current ?? []),
      loaded: current !== null || failed,
      failed,
      refresh,
    }),
    [current, failed, refresh],
  )
  return <InvitesContext.Provider value={value}>{children}</InvitesContext.Provider>
}

export function useInvites() {
  const ctx = useContext(InvitesContext)
  if (!ctx) throw new Error('useInvites must be used within InvitesProvider')
  return ctx
}
