'use client'

import { useCallback, useEffect, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Trash2 } from 'lucide-react'

import { deleteMoment, listMyMoments } from '@/api/moments'
import ConfirmDialog from '@/components/confirm-dialog'
import PageLoading from '@/components/page-loading'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { errorSummary } from '@/lib/error-summary'
import { shouldRefreshOnError } from '@/lib/moment-refresh'
import { formatDuration } from '@/lib/moments-by-day'
import { loginPath } from '@/lib/safe-next'
import { safeMediaUrl } from '@/lib/safe-url'

import type { MomentView } from '@/api/moments/type'

export default function MyMomentsContent() {
  const router = useRouter()
  const { status } = useAuth()
  const { showToast } = useToast()
  const [moments, setMoments] = useState<MomentView[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [target, setTarget] = useState<MomentView | null>(null)
  const [lastErrorRefresh, setLastErrorRefresh] = useState<number | null>(null)

  const load = useCallback(() => {
    listMyMoments()
      .then((list) => {
        setMoments(list)
        setFailed(false)
      })
      .catch((err) => {
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
    if (!shouldRefreshOnError(lastErrorRefresh, now)) return
    setLastErrorRefresh(now)
    load()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">รูปของฉัน</h1>

      {failed && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
          <p className="mb-3">โหลดรูปไม่สำเร็จ</p>
          <button
            onClick={load}
            className="rounded-lg bg-[#0163a4] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#015387]"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {!failed && moments?.length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
          ยังไม่มีรูปที่คุณแปะ
        </div>
      )}

      {!failed && moments && moments.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {moments.map((m) => {
            const thumb = safeMediaUrl(m.thumb_url)
            return (
              <li key={m.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="relative aspect-square bg-gray-100">
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
                    <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-xs text-white">
                      ▶ {formatDuration(m.duration_ms)}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setTarget(m)}
                    aria-label="ลบรูป"
                    className="absolute top-1 right-1 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="p-2 text-xs">
                  {m.journey ? (
                    <Link
                      href={`/plans/${encodeURIComponent(m.journey.slug)}`}
                      className="block truncate font-medium text-[#0163a4] hover:underline"
                    >
                      {m.journey.title}
                    </Link>
                  ) : null}
                  {m.caption && <p className="truncate text-gray-500">{m.caption}</p>}
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
