import { describe, expect, it } from 'vitest'

import { createFeedPager } from './feed-pager'

import type { FeedItem, FeedPage } from '@/api/feed/type'

const item = (id: string) => ({ id }) as FeedItem

describe('createFeedPager', () => {
  it('overlapping loadMore calls fire once', async () => {
    let calls = 0
    const pager = createFeedPager(async () => {
      calls++
      return { items: [item('a')], next_before: 'c1' }
    })
    await Promise.all([pager.loadMore(), pager.loadMore()])
    expect(calls).toBe(1)
    expect(pager.items.map((i) => i.id)).toEqual(['a'])
    expect(pager.loading).toBe(false)
  })

  it('treats a missing next_before as the end and tracks the first load', async () => {
    const pager = createFeedPager(async () => ({ items: [item('a')] }) as FeedPage)
    expect(pager.loaded).toBe(false)
    await pager.loadMore()
    expect(pager.loaded).toBe(true)
    expect(pager.hasMore).toBe(false)
  })

  it('marks loaded even when the first load fails', async () => {
    const pager = createFeedPager(async () => {
      throw new Error('x')
    })
    await pager.loadMore()
    expect(pager.loaded).toBe(true)
    expect(pager.error).not.toBeNull()
  })

  it('passes the cursor and stops when next_before is null', async () => {
    const seen: Array<string | undefined> = []
    const pages: FeedPage[] = [
      { items: [item('a')], next_before: 'c1' },
      { items: [item('b')], next_before: null },
    ]
    const pager = createFeedPager(async (before) => {
      seen.push(before)
      return pages.shift()!
    })
    expect(pager.hasMore).toBe(true)
    await pager.loadMore()
    expect(pager.hasMore).toBe(true)
    await pager.loadMore()
    expect(pager.hasMore).toBe(false)
    await pager.loadMore()
    expect(seen).toEqual([undefined, 'c1'])
  })

  it('dedupes by id', async () => {
    const pages: FeedPage[] = [
      { items: [item('a'), item('b')], next_before: 'c1' },
      { items: [item('b'), item('c')], next_before: null },
    ]
    const pager = createFeedPager(async () => pages.shift()!)
    await pager.loadMore()
    await pager.loadMore()
    expect(pager.items.map((i) => i.id)).toEqual(['a', 'b', 'c'])
  })

  it('surfaces errors, keeps items and allows retry', async () => {
    let n = 0
    const pager = createFeedPager(async () => {
      n++
      if (n === 2) throw new Error('boom')
      return { items: [item(`i${n}`)], next_before: 'c' }
    })
    await pager.loadMore()
    await pager.loadMore()
    expect(pager.error).toBeInstanceOf(Error)
    expect(pager.items.map((i) => i.id)).toEqual(['i1'])
    expect(pager.hasMore).toBe(true)
    expect(pager.loading).toBe(false)
    await pager.loadMore()
    expect(pager.error).toBeNull()
    expect(pager.items.map((i) => i.id)).toEqual(['i1', 'i3'])
  })
})
