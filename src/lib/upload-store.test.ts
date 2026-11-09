import { describe, expect, it, vi } from 'vitest'

import { createUploadStore, uploadKey } from './upload-store'

import type { UploadItem } from './moment-upload'

const file = (name: string) => new File(['x'], name, { type: 'image/jpeg' })

const deferred = () => {
  let resolve!: (items: UploadItem[]) => void
  const promise = new Promise<UploadItem[]>((r) => (resolve = r))
  return { promise, resolve }
}

describe('uploadKey', () => {
  it('distinguishes day and plan scope', () => {
    expect(uploadKey('d1')).not.toBe(uploadKey('d1', 'p1'))
    expect(uploadKey('d1', 'p1')).not.toBe(uploadKey('d2', 'p1'))
  })
})

describe('createUploadStore', () => {
  it('tracks busy and items per key while a batch is in flight', async () => {
    const d = deferred()
    const run = vi.fn(
      (_f: File[], _c: unknown, _d: unknown, onUpdate: (i: UploadItem[]) => void) => {
        onUpdate([{ name: 'a', progress: 0.5, state: 'uploading' }])
        return d.promise
      },
    )
    const store = createUploadStore({ run: run as never })
    const ctx = { slug: 's', dayId: 'd1' }
    const p = store.start(ctx, [file('a')])
    expect(store.isBusy(uploadKey('d1'))).toBe(true)
    expect(store.isBusy(uploadKey('d1', 'p1'))).toBe(false)
    expect(store.getItems(uploadKey('d1'))).toHaveLength(1)
    expect(store.busyDayIds()).toEqual(new Set(['d1']))
    expect(store.anyBusy()).toBe(true)
    d.resolve([{ name: 'a', progress: 1, state: 'done' }])
    await p
    expect(store.isBusy(uploadKey('d1'))).toBe(false)
    expect(store.anyBusy()).toBe(false)
    expect(store.busyDayIds().size).toBe(0)
    expect(store.getItems(uploadKey('d1'))[0].state).toBe('done')
  })

  it('ignores a second start for a busy key', async () => {
    const d = deferred()
    const run = vi.fn(() => d.promise)
    const store = createUploadStore({ run: run as never })
    const ctx = { slug: 's', dayId: 'd1', planId: 'p1' }
    const p = store.start(ctx, [file('a')])
    await store.start(ctx, [file('b')])
    expect(run).toHaveBeenCalledTimes(1)
    d.resolve([])
    await p
  })

  it('notifies subscribers, stops after unsubscribe, and calls onBatchDone', async () => {
    const onBatchDone = vi.fn()
    const store = createUploadStore({
      run: vi.fn(async () => [{ name: 'a', progress: 1, state: 'done' }]) as never,
      onBatchDone,
    })
    const listener = vi.fn()
    const off = store.subscribe(listener)
    await store.start({ slug: 's', dayId: 'd1' }, [file('a')])
    expect(listener).toHaveBeenCalled()
    expect(onBatchDone).toHaveBeenCalledTimes(1)
    off()
    listener.mockClear()
    store.dismiss(uploadKey('d1'))
    expect(listener).not.toHaveBeenCalled()
    expect(store.getItems(uploadKey('d1'))).toEqual([])
  })

  it('releases busy even when the engine throws', async () => {
    const store = createUploadStore({
      run: vi.fn(async () => {
        throw new Error('boom')
      }) as never,
    })
    await store.start({ slug: 's', dayId: 'd1' }, [file('a')])
    expect(store.anyBusy()).toBe(false)
  })

  it('getItems keeps a stable reference between changes', () => {
    const store = createUploadStore()
    expect(store.getItems('x')).toBe(store.getItems('x'))
  })
})
