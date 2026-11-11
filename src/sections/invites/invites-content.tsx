'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { Inbox } from 'lucide-react'

import { acceptInvite, declineInvite } from '@/api/members'
import PageLoading from '@/components/page-loading'
import { useAuth } from '@/contexts/auth-context'
import { useInvites } from '@/contexts/invites-context'
import { useToast } from '@/contexts/toast-context'
import { memberErrorMessage } from '@/lib/member-errors'
import { loginPath } from '@/lib/safe-next'
import { buttonClass } from '@/lib/ui-classes'

export default function InvitesContent() {
  const router = useRouter()
  const { status } = useAuth()
  const { invites, loaded, failed, refresh } = useInvites()
  const { showToast } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'anon') router.replace(loginPath('/invites'))
  }, [status, router])

  // Refresh when the page opens, so a new invite shows up without a reload.
  useEffect(() => {
    if (status === 'authed') void refresh()
  }, [status, refresh])

  if (status !== 'authed' || !loaded) return <PageLoading />

  if (failed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Invites</h1>
        <div className="rounded-card bg-surface p-8 text-center text-gray-500 shadow-soft">
          <p className="mb-3">Could not load your invites.</p>
          <button
            onClick={() => void refresh()}
            className={buttonClass('primary', 'sm')}
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const respond = async (id: string, slug: string, accept: boolean) => {
    if (busyId) return
    setBusyId(id)
    try {
      if (accept) await acceptInvite(id)
      else await declineInvite(id)
      await refresh()
      if (accept) {
        showToast('You joined the trip')
        router.push(`/plans/${encodeURIComponent(slug)}`)
        return
      }
      showToast('Invite declined')
    } catch (err) {
      showToast(memberErrorMessage(err), 'error')
      void refresh()
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Invites</h1>
      {invites.length === 0 ? (
        <div className="rounded-card bg-surface p-8 text-center text-gray-500 shadow-soft">
          <Inbox size={28} className="mx-auto mb-2 text-gray-300" />
          <p>No pending invites.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {invites.map((inv) => (
            <li
              key={inv.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-surface p-4 shadow-soft"
            >
              <div className="min-w-0">
                <p className="font-semibold text-gray-800 truncate">{inv.journey_title}</p>
                <p className="text-sm text-gray-500">
                  {inv.invited_by ? `@${inv.invited_by} invited you as ` : 'Invited as '}
                  <span className="font-medium">{inv.role}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={busyId !== null}
                  onClick={() => respond(inv.id, inv.journey_slug, false)}
                  className={buttonClass('secondary', 'sm')}
                >
                  Decline
                </button>
                <button
                  disabled={busyId !== null}
                  onClick={() => respond(inv.id, inv.journey_slug, true)}
                  className={buttonClass('primary', 'sm')}
                >
                  Accept
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
