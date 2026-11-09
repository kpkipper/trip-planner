'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import {
  acceptFollowRequest,
  declineFollowRequest,
  listFollowers,
  listFollowRequests,
  removeFollower,
} from '@/api/follows'
import ConfirmDialog from '@/components/confirm-dialog'
import PageLoading from '@/components/page-loading'
import UserAvatar from '@/components/user-avatar'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { errorSummary } from '@/lib/error-summary'
import { isGone, removeEntry } from '@/lib/follow-requests'
import { loginPath } from '@/lib/safe-next'

import type { FollowEntry } from '@/api/follows/type'
import type { PublicProfileType } from '@/api/journey/type'

const card = 'rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm'

function UserLink({ user }: { user: PublicProfileType }) {
  return (
    <>
      <UserAvatar user={user} size={40} />
      <Link
        href={`/u/${encodeURIComponent(user.username)}`}
        className="min-w-0 flex-1 hover:underline"
      >
        <span className="block truncate text-sm font-medium text-gray-800">
          {user.display_name || user.username}
        </span>
        <span className="block truncate text-xs text-gray-500">@{user.username}</span>
      </Link>
    </>
  )
}

export default function FollowRequestsContent() {
  const router = useRouter()
  const { status } = useAuth()
  const { showToast } = useToast()
  const [requests, setRequests] = useState<FollowEntry[] | null>(null)
  const [followers, setFollowers] = useState<FollowEntry[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState<string | null>(null)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'anon') router.replace(loginPath('/follow-requests'))
  }, [status, router])

  useEffect(() => {
    if (status !== 'authed') return
    let cancelled = false
    Promise.all([listFollowRequests(), listFollowers()])
      .then(([reqs, fols]) => {
        if (cancelled) return
        setRequests(reqs.items)
        setFollowers(fols)
        setFailed(false)
      })
      .catch((err) => {
        if (cancelled) return
        setFailed(true)
        console.error('Failed to load follow requests:', errorSummary(err))
      })
    return () => {
      cancelled = true
    }
  }, [status, attempt])

  if (status !== 'authed' || (requests === null && !failed)) return <PageLoading />

  const respond = async (username: string, accept: boolean) => {
    if (busy) return
    setBusy(username)
    try {
      if (accept) await acceptFollowRequest(username)
      else await declineFollowRequest(username)
      setRequests((list) => (list ? removeEntry(list, username) : list))
      if (accept) {
        // Reload so the new follower shows up in the Followers section.
        listFollowers()
          .then(setFollowers)
          .catch((err) => console.error('Failed to refresh followers:', errorSummary(err)))
      }
      showToast(accept ? `Accepted @${username}` : `Declined @${username}`)
    } catch (err) {
      if (isGone(err)) {
        setRequests((list) => (list ? removeEntry(list, username) : list))
        showToast('That request is no longer available')
      } else {
        showToast(
          accept ? 'Could not accept the request' : 'Could not decline the request',
          'error',
        )
      }
      console.error('Failed to answer follow request:', errorSummary(err))
    } finally {
      setBusy(null)
    }
  }

  const remove = async (username: string) => {
    if (busy) return
    setRemoving(null)
    setBusy(username)
    try {
      await removeFollower(username)
      setFollowers((list) => (list ? removeEntry(list, username) : list))
      showToast(`Removed @${username}`)
    } catch (err) {
      if (isGone(err)) {
        setFollowers((list) => (list ? removeEntry(list, username) : list))
      } else {
        showToast('Could not remove follower', 'error')
      }
      console.error('Failed to remove follower:', errorSummary(err))
    } finally {
      setBusy(null)
    }
  }

  const rowClass = 'flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3'

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      {failed ? (
        <div className={card}>
          <p className="mb-3">Could not load follow requests</p>
          <button
            type="button"
            onClick={() => {
              setFailed(false)
              setRequests(null)
              setAttempt((n) => n + 1)
            }}
            className="rounded-lg bg-[#0163a4] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#015387]"
          >
            Try again
          </button>
        </div>
      ) : (
        <>
          <section className="mb-10">
            <h1 className="mb-4 text-2xl font-bold text-gray-800">Follow requests</h1>
            {requests?.length === 0 ? (
              <div className={card}>No pending requests</div>
            ) : (
              <ul className="space-y-2">
                {requests?.map((r) => (
                  <li key={r.user.username} className={rowClass}>
                    <UserLink user={r.user} />
                    <button
                      type="button"
                      onClick={() => void respond(r.user.username, true)}
                      disabled={busy !== null}
                      className="rounded-lg bg-[#0163a4] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#0470b9] disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => void respond(r.user.username, false)}
                      disabled={busy !== null}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-gray-800">Followers</h2>
            {followers?.length === 0 ? (
              <div className={card}>No followers yet</div>
            ) : (
              <ul className="space-y-2">
                {followers?.map((f) => (
                  <li key={f.user.username} className={rowClass}>
                    <UserLink user={f.user} />
                    <button
                      type="button"
                      onClick={() => setRemoving(f.user.username)}
                      disabled={busy !== null}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <ConfirmDialog
        open={removing !== null}
        title="Remove follower"
        description={`Remove @${removing} as a follower? They won't be told.`}
        confirmLabel="Remove"
        onConfirm={() => removing && void remove(removing)}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}
