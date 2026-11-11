'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { listBlocks, unblockUser } from '@/api/safety'
import PageLoading from '@/components/page-loading'
import UserAvatar from '@/components/user-avatar'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { errorSummary } from '@/lib/error-summary'
import { loginPath } from '@/lib/safe-next'
import { buttonClass } from '@/lib/ui-classes'

import type { PublicProfileType } from '@/api/journey/type'

export default function BlocksContent() {
  const router = useRouter()
  const { status } = useAuth()
  const { showToast } = useToast()
  const [users, setUsers] = useState<PublicProfileType[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'anon') router.replace(loginPath('/blocks'))
  }, [status, router])

  useEffect(() => {
    if (status !== 'authed') return
    let cancelled = false
    listBlocks()
      .then((list) => {
        if (cancelled) return
        setUsers(list)
        setFailed(false)
      })
      .catch((err) => {
        if (cancelled) return
        setFailed(true)
        console.error('Failed to load blocks:', errorSummary(err))
      })
    return () => {
      cancelled = true
    }
  }, [status, attempt])

  if (status !== 'authed' || (users === null && !failed)) return <PageLoading />

  const unblock = async (username: string) => {
    if (busy) return
    setBusy(username)
    try {
      await unblockUser(username)
      setUsers((list) => list?.filter((u) => u.username !== username) ?? null)
      showToast(`เลิก block @${username} แล้ว`)
    } catch (err) {
      showToast('Unblock ไม่สำเร็จ', 'error')
      console.error('Failed to unblock:', errorSummary(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">คนที่ block</h1>
      {failed && (
        <div className="rounded-card bg-surface p-8 text-center text-gray-500 shadow-soft">
          <p className="mb-3">โหลดรายการไม่สำเร็จ</p>
          <button
            type="button"
            onClick={() => {
              setFailed(false)
              setUsers(null)
              setAttempt((n) => n + 1)
            }}
            className={buttonClass('primary', 'sm')}
          >
            ลองใหม่
          </button>
        </div>
      )}
      {!failed && users?.length === 0 && (
        <div className="rounded-card bg-surface p-8 text-center text-gray-500 shadow-soft">
          ยังไม่ได้ block ใคร
        </div>
      )}
      {!failed && users && users.length > 0 && (
        <ul className="space-y-2">
          {users.map((u) => (
            <li
              key={u.username}
              className="flex items-center gap-3 rounded-tile bg-surface p-3 shadow-soft"
            >
              <UserAvatar user={u} size={40} />
              <Link
                href={`/u/${encodeURIComponent(u.username)}`}
                className="min-w-0 flex-1 hover:underline"
              >
                <span className="block truncate text-sm font-medium text-gray-800">
                  {u.display_name || u.username}
                </span>
                <span className="block truncate text-xs text-gray-500">@{u.username}</span>
              </Link>
              <button
                type="button"
                onClick={() => void unblock(u.username)}
                disabled={busy !== null}
                className={buttonClass('secondary', 'sm')}
              >
                Unblock
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
