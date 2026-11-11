'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { listBlocks, unblockUser } from '@/api/safety'
import PageLoading from '@/components/page-loading'
import { EmptyCard, ListCard, listRowClass, PageTitle, UserLink } from '@/components/ui/list'
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
      <PageTitle>คนที่ block</PageTitle>
      {failed && (
        <EmptyCard
          action={
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
          }
        >
          โหลดรายการไม่สำเร็จ
        </EmptyCard>
      )}
      {!failed && users?.length === 0 && <EmptyCard>ยังไม่ได้ block ใคร</EmptyCard>}
      {!failed && users && users.length > 0 && (
        <ListCard>
          {users.map((u) => (
            <li key={u.username} className={listRowClass}>
              <UserLink user={u} />
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
        </ListCard>
      )}
    </div>
  )
}
