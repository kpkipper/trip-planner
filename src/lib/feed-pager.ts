import type { FeedItem, FeedPage } from '@/api/feed/type'

export interface FeedPager {
  readonly items: FeedItem[]
  readonly hasMore: boolean
  readonly loading: boolean
  readonly error: unknown
  loadMore(): Promise<void>
}

export const createFeedPager = (
  fetchPage: (before?: string) => Promise<FeedPage>,
  onChange?: () => void,
): FeedPager => {
  let items: FeedItem[] = []
  const seen = new Set<string>()
  let cursor: string | undefined
  let hasMore = true
  let loading = false
  let error: unknown = null

  return {
    get items() {
      return items
    },
    get hasMore() {
      return hasMore
    },
    get loading() {
      return loading
    },
    get error() {
      return error
    },
    async loadMore() {
      if (loading || !hasMore) return
      loading = true
      error = null
      onChange?.()
      try {
        const page = await fetchPage(cursor)
        const fresh = page.items.filter((i) => !seen.has(i.id))
        fresh.forEach((i) => seen.add(i.id))
        items = [...items, ...fresh]
        cursor = page.next_before ?? undefined
        hasMore = page.next_before !== null
      } catch (err) {
        error = err
      } finally {
        loading = false
        onChange?.()
      }
    },
  }
}
