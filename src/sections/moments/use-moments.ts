import { useCallback, useEffect, useRef, useState } from 'react'

import { listMoments } from '@/api/moments'
import { errorSummary } from '@/lib/error-summary'
import { shouldRefreshOnError, shouldRefreshOnVisible } from '@/lib/moment-refresh'

import type { MomentView } from '@/api/moments/type'

// Moments of a trip. Signed media URLs expire (~1h), so the list is reloaded when the tab
// comes back after 50+ minutes and (at most once per 5 minutes) when media fails to load.
export function useMoments(slug: string, enabled = true) {
  const [moments, setMoments] = useState<MomentView[]>([])
  const lastLoadAt = useRef(0)
  const lastErrorRefreshAt = useRef<number | null>(null)

  const reload = useCallback(async () => {
    try {
      const list = await listMoments(slug)
      lastLoadAt.current = Date.now()
      setMoments(list)
    } catch (err) {
      console.error('Failed to load moments:', errorSummary(err))
    }
  }, [slug])

  useEffect(() => {
    if (!enabled) return
    let cancelled = false
    listMoments(slug)
      .then((list) => {
        if (cancelled) return
        lastLoadAt.current = Date.now()
        setMoments(list)
      })
      .catch((err) => console.error('Failed to load moments:', errorSummary(err)))
    return () => {
      cancelled = true
    }
  }, [enabled, slug])

  useEffect(() => {
    if (!enabled) return
    const onVisible = () => {
      if (
        document.visibilityState === 'visible' &&
        shouldRefreshOnVisible(lastLoadAt.current, Date.now())
      )
        void reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [enabled, reload])

  const onMediaError = useCallback(() => {
    const now = Date.now()
    if (!shouldRefreshOnError(lastErrorRefreshAt.current, now)) return
    lastErrorRefreshAt.current = now
    void reload()
  }, [reload])

  return { moments, reload, onMediaError }
}
