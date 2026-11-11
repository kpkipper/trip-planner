'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import PageLoading from '@/components/page-loading'
import { useAuth } from '@/contexts/auth-context'
import { loginPath } from '@/lib/safe-next'
import { buttonClass } from '@/lib/ui-classes'

import FeedItem from './feed-item'
import NowRow from './now-row'
import { useFeed } from './use-feed'

export default function FeedContent() {
  const router = useRouter()
  const { status } = useAuth()
  const feed = useFeed(status === 'authed')
  const [now] = useState(() => new Date())

  useEffect(() => {
    if (status === 'anon') router.replace(loginPath('/feed'))
  }, [status, router])

  if (status !== 'authed') return <PageLoading />

  const firstLoad = !feed.loaded && feed.items.length === 0 && feed.error == null
  const empty = feed.loaded && !feed.loading && !feed.error && feed.items.length === 0

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
      <h1 className="mb-4 text-[28px] font-semibold leading-snug tracking-tight text-ink">Feed</h1>
      <NowRow travelers={feed.travelers} />
      {firstLoad && <PageLoading />}
      {empty && (
        <p className="py-10 text-center leading-normal text-muted">ยังไม่มีอะไรใน feed ลอง follow เพื่อนดูสิ</p>
      )}
      <ul className="flex flex-col gap-4 md:gap-5">
        {feed.items.map((item) => (
          <FeedItem key={item.id} item={item} now={now} />
        ))}
      </ul>
      {feed.error != null && (
        <p role="alert" className="mt-4 text-center text-sm text-danger">
          โหลด feed ไม่สำเร็จ
        </p>
      )}
      {(feed.hasMore || feed.error != null) && feed.items.length > 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={feed.loadMore}
            disabled={feed.loading}
            className={buttonClass('secondary', 'md')}
          >
            {feed.loading ? 'กำลังโหลด…' : 'โหลดเพิ่ม'}
          </button>
        </div>
      )}
      {feed.error != null && feed.items.length === 0 && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={feed.loadMore}
            className={buttonClass('secondary', 'md')}
          >
            ลองอีกครั้ง
          </button>
        </div>
      )}
    </div>
  )
}
