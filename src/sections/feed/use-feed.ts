import { useCallback, useEffect, useReducer, useState } from 'react'

import { getFeed, getNowTravelers } from '@/api/feed'
import { createFeedPager } from '@/lib/feed-pager'

import type { NowTraveler } from '@/api/feed/type'

export const useFeed = (enabled: boolean) => {
  const [, bump] = useReducer((n: number) => n + 1, 0)
  const [pager] = useState(() => createFeedPager((before) => getFeed(before), bump))
  const [travelers, setTravelers] = useState<NowTraveler[]>([])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    void pager.loadMore()
    getNowTravelers()
      .then((list) => !cancelled && setTravelers(list))
      .catch(() => {
        // the row is optional: hide it when it cannot load
      })
    return () => {
      cancelled = true
    }
  }, [enabled, pager])

  const loadMore = useCallback(() => void pager.loadMore(), [pager])

  return {
    items: pager.items,
    hasMore: pager.hasMore,
    loading: pager.loading,
    error: pager.error,
    loadMore,
    travelers,
  }
}
