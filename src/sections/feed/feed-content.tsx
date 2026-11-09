'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import PageLoading from '@/components/page-loading'
import { useAuth } from '@/contexts/auth-context'
import { loginPath } from '@/lib/safe-next'

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
    <div className="mx-auto w-full max-w-xl px-4 py-6">
      <NowRow travelers={feed.travelers} />
      {firstLoad && <PageLoading />}
      {empty && (
        <p className="text-center text-gray-500 py-10">ยังไม่มีอะไรใน feed ลอง follow เพื่อนดูสิ</p>
      )}
      <ul className="flex flex-col gap-3">
        {feed.items.map((item) => (
          <FeedItem key={item.id} item={item} now={now} />
        ))}
      </ul>
      {feed.error != null && (
        <p role="alert" className="text-center text-sm text-red-600 mt-4">
          โหลด feed ไม่สำเร็จ
        </p>
      )}
      {(feed.hasMore || feed.error != null) && feed.items.length > 0 && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={feed.loadMore}
            disabled={feed.loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {feed.loading ? 'กำลังโหลด…' : 'โหลดเพิ่ม'}
          </button>
        </div>
      )}
      {feed.error != null && feed.items.length === 0 && (
        <div className="flex justify-center mt-4">
          <button
            type="button"
            onClick={feed.loadMore}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            ลองอีกครั้ง
          </button>
        </div>
      )}
    </div>
  )
}
