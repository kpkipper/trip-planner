'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { Inbox } from 'lucide-react'

import { acceptInvite, declineInvite } from '@/api/members'
import PageLoading from '@/components/page-loading'
import { ButtonLink } from '@/components/ui/button'
import { EmptyCard, ListCard, listRowClass, PageTitle } from '@/components/ui/list'
import { useAuth } from '@/contexts/auth-context'
import { useInvites } from '@/contexts/invites-context'
import { useToast } from '@/contexts/toast-context'
import { memberErrorMessage } from '@/lib/member-errors'
import { loginPath } from '@/lib/safe-next'
import { buttonClass, cn } from '@/lib/ui-classes'

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
      <div className="mx-auto max-w-2xl px-4 py-8">
        <PageTitle>Invites</PageTitle>
        <EmptyCard
          action={
            <button onClick={() => void refresh()} className={buttonClass('primary', 'sm')}>
              Retry
            </button>
          }
        >
          Could not load your invites.
        </EmptyCard>
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageTitle>Invites</PageTitle>
      {invites.length === 0 ? (
        <EmptyCard
          action={
            <ButtonLink href="/trips" variant="secondary" size="sm">
              My trips
            </ButtonLink>
          }
        >
          <Inbox size={28} className="mx-auto mb-2 text-muted/60" />
          <p>No pending invites.</p>
        </EmptyCard>
      ) : (
        <ListCard>
          {invites.map((inv) => (
            <li key={inv.id} className={cn(listRowClass, 'flex-wrap justify-between py-4')}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold leading-normal text-ink">
                  {inv.journey_title}
                </p>
                <p className="text-sm leading-normal text-muted">
                  {inv.invited_by ? `@${inv.invited_by} invited you as ` : 'Invited as '}
                  <span className="font-medium text-ink-2">{inv.role}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={busyId !== null}
                  onClick={() => respond(inv.id, inv.journey_slug, false)}
                  className={cn(buttonClass('ghost', 'sm'), 'text-muted')}
                >
                  Decline
                </button>
                <button
                  disabled={busyId !== null}
                  onClick={() => respond(inv.id, inv.journey_slug, true)}
                  className={buttonClass('secondary', 'sm')}
                >
                  Accept
                </button>
              </div>
            </li>
          ))}
        </ListCard>
      )}
    </div>
  )
}
