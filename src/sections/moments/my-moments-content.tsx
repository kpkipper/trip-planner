'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Trash2 } from 'lucide-react'

import { deleteMoment, listMyMoments } from '@/api/moments'
import ConfirmDialog from '@/components/confirm-dialog'
import PageLoading from '@/components/page-loading'
import { ButtonLink } from '@/components/ui/button'
import { EmptyCard, PageTitle } from '@/components/ui/list'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { errorSummary } from '@/lib/error-summary'
import { shouldRefreshOnError } from '@/lib/moment-refresh'
import { formatDuration } from '@/lib/moments-by-day'
import { loginPath } from '@/lib/safe-next'
import { safeMediaUrl } from '@/lib/safe-url'
import { buttonClass } from '@/lib/ui-classes'

import type { MomentView } from '@/api/moments/type'

export default function MyMomentsContent() {
  const router = useRouter()
  const { status } = useAuth()
  const { showToast } = useToast()
  const [moments, setMoments] = useState<MomentView[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [target, setTarget] = useState<MomentView | null>(null)
  const lastErrorRefresh = useRef<number | null>(null)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const load = useCallback(() => {
    listMyMoments()
      .then((list) => {
        if (!mounted.current) return
        setMoments(list)
        setFailed(false)
      })
      .catch((err) => {
        if (!mounted.current) return
        setFailed(true)
        console.error('Failed to load my moments:', errorSummary(err))
      })
  }, [])

  useEffect(() => {
    if (status === 'anon') router.replace(loginPath('/me/moments'))
  }, [status, router])

  useEffect(() => {
    if (status !== 'authed') return
    let cancelled = false
    listMyMoments()
      .then((list) => !cancelled && setMoments(list))
      .catch((err) => {
        if (cancelled) return
        setFailed(true)
        console.error('Failed to load my moments:', errorSummary(err))
      })
    return () => {
      cancelled = true
    }
  }, [status])

  if (status !== 'authed' || (moments === null && !failed)) return <PageLoading />

  const remove = async () => {
    const m = target
    setTarget(null)
    if (!m) return
    try {
      await deleteMoment(m.id)
      setMoments((list) => list?.filter((x) => x.id !== m.id) ?? null)
      showToast('ลบรูปแล้ว')
    } catch (err) {
      showToast('ลบรูปไม่สำเร็จ', 'error')
      console.error('Failed to delete moment:', errorSummary(err))
    }
  }

  const onImageError = () => {
    const now = Date.now()
    if (!shouldRefreshOnError(lastErrorRefresh.current, now)) return
    lastErrorRefresh.current = now
    load()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageTitle>รูปของฉัน</PageTitle>

      {failed && (
        <EmptyCard
          action={
            <button onClick={load} className={buttonClass('primary', 'sm')}>
              ลองใหม่
            </button>
          }
        >
          โหลดรูปไม่สำเร็จ
        </EmptyCard>
      )}

      {!failed && moments?.length === 0 && (
        <EmptyCard
          action={
            <ButtonLink href="/trips" variant="secondary" size="sm">
              My trips
            </ButtonLink>
          }
        >
          ยังไม่มีรูปที่คุณอัปโหลด
        </EmptyCard>
      )}

      {!failed && moments && moments.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {moments.map((m) => {
            const thumb = safeMediaUrl(m.thumb_url)
            return (
              <li
                key={m.id}
                className="min-w-0 overflow-hidden rounded-tile bg-surface shadow-soft"
              >
                <div className="relative aspect-square bg-chip">
                  {thumb && (
                    // eslint-disable-next-line @next/next/no-img-element -- static export, signed remote URL
                    <img
                      src={thumb}
                      alt={m.caption}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={onImageError}
                      className="h-full w-full object-cover"
                    />
                  )}
                  {m.kind === 'video' && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 text-xs leading-normal text-white">
                      ▶ {formatDuration(m.duration_ms)}
                    </span>
                  )}
                  {m.can_delete && (
                    <button
                      type="button"
                      onClick={() => setTarget(m)}
                      aria-label="ลบรูป"
                      className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="px-3 py-2.5 text-xs leading-normal">
                  {m.journey ? (
                    <Link
                      href={`/plans/${encodeURIComponent(m.journey.slug)}`}
                      className="block truncate rounded font-medium text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      {m.journey.title}
                    </Link>
                  ) : null}
                  {m.caption && <p className="truncate text-muted">{m.caption}</p>}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!target}
        title="ลบรูปนี้?"
        description="ลบแล้วกู้คืนไม่ได้"
        confirmLabel="ลบ"
        onConfirm={remove}
        onCancel={() => setTarget(null)}
      />
    </div>
  )
}
