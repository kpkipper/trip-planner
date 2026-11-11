'use client'

import { useEffect, useRef, useState } from 'react'

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
import {
  dropRemoved,
  isGone,
  notifyFollowRequestsChanged,
  removeEntry,
} from '@/lib/follow-requests'
import { loginPath } from '@/lib/safe-next'
import { buttonClass } from '@/lib/ui-classes'

import type { FollowEntry } from '@/api/follows/type'
import type { PublicProfileType } from '@/api/journey/type'

const card = 'rounded-card bg-surface p-8 text-center text-gray-500 shadow-soft'

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
  const mounted = useRef(true)
  // Followers refetches: only the latest may land, minus anyone removed since it started.
  const followersSeq = useRef(0)
  const removedLog = useRef<string[]>([])
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

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
        const seq = ++followersSeq.current
        const mark = removedLog.current.length
        listFollowers()
          .then((list) => {
            if (!mounted.current || seq !== followersSeq.current) return
            setFollowers(dropRemoved(list, removedLog.current.slice(mark)))
          })
          .catch((err) => console.error('Failed to refresh followers:', errorSummary(err)))
      }
      notifyFollowRequestsChanged()
      showToast(accept ? `Accepted @${username}` : `Declined @${username}`)
    } catch (err) {
      if (isGone(err)) {
        setRequests((list) => (list ? removeEntry(list, username) : list))
        notifyFollowRequestsChanged()
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
      removedLog.current.push(username)
      setFollowers((list) => (list ? removeEntry(list, username) : list))
      showToast(`Removed @${username}`)
    } catch (err) {
      if (isGone(err)) {
        removedLog.current.push(username)
        setFollowers((list) => (list ? removeEntry(list, username) : list))
      } else {
        showToast('Could not remove follower', 'error')
      }
      console.error('Failed to remove follower:', errorSummary(err))
    } finally {
      setBusy(null)
    }
  }

  const rowClass = 'flex items-center gap-3 rounded-tile bg-surface p-3 shadow-soft'

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
            className={buttonClass('primary', 'sm')}
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
                      className={buttonClass('primary', 'sm')}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => void respond(r.user.username, false)}
                      disabled={busy !== null}
                      className={buttonClass('secondary', 'sm')}
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
                      className={buttonClass('secondary', 'sm')}
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
        description={`Remove @${removing ?? ''} as a follower? They won't be told.`}
        confirmLabel="Remove"
        onConfirm={() => removing && void remove(removing)}
        onCancel={() => setRemoving(null)}
      />
    </div>
  )
}
