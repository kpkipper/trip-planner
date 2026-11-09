import { describe, expect, it, vi } from 'vitest'

import { putFile, uploadAll, type UploadItem, validateFile } from './moment-upload'

import type { MomentView, UploadTarget } from '@/api/moments/type'

const MB = 1024 * 1024
const file = (type: string, size = 10, name = 'f') => {
  const f = new File(['x'], name, { type })
  Object.defineProperty(f, 'size', { value: size })
  return f
}

describe('validateFile', () => {
  it.each([
    ['image/jpeg', 1, 'photo'],
    ['image/png', 10 * MB, 'photo'],
    ['image/webp', 1, 'photo'],
    ['video/mp4', 100 * MB, 'video'],
    ['video/quicktime', 1, 'video'],
  ])('accepts %s (%d)', (type, size, kind) => {
    expect(validateFile(file(type, size))).toEqual({ kind })
  })

  it.each([
    ['image/heic', 1],
    ['image/gif', 1],
    ['image/jpeg', 10 * MB + 1],
    ['video/mp4', 100 * MB + 1],
    ['application/pdf', 1],
  ])('rejects %s (%d)', (type, size) => {
    const res = validateFile(file(type, size))
    expect('error' in res && res.error.length > 0).toBe(true)
  })

  it('uses the Thai messages', () => {
    expect(validateFile(file('image/gif'))).toEqual({ error: 'ไฟล์ชนิดนี้ใช้ไม่ได้' })
    expect(validateFile(file('image/jpeg', 10 * MB + 1))).toEqual({ error: 'ไฟล์ใหญ่เกินไป' })
  })
})

class FakeXhr {
  method = ''
  url = ''
  headers: Record<string, string> = {}
  status = 200
  sent: unknown
  upload: { onprogress: ((e: unknown) => void) | null } = { onprogress: null }
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  open(method: string, url: string) {
    this.method = method
    this.url = url
  }
  setRequestHeader(k: string, v: string) {
    this.headers[k] = v
  }
  send(body: unknown) {
    this.sent = body
  }
}

const target: UploadTarget = {
  url: 'https://storage.googleapis.com/b/o?sig=1',
  method: 'PUT',
  headers: { 'Content-Type': 'image/jpeg', 'x-goog-content-length-range': '0,10485760' },
}

describe('putFile', () => {
  it('uses the exact method, url and headers, with no Authorization', async () => {
    const xhr = new FakeXhr()
    const f = file('image/jpeg')
    const onProgress = vi.fn()
    const p = putFile(target, f, onProgress, () => xhr as unknown as XMLHttpRequest)
    xhr.upload.onprogress?.({ lengthComputable: true, loaded: 5, total: 10 })
    xhr.onload?.()
    await p
    expect(xhr.method).toBe('PUT')
    expect(xhr.url).toBe(target.url)
    expect(xhr.headers).toEqual(target.headers)
    expect(Object.keys(xhr.headers).map((k) => k.toLowerCase())).not.toContain('authorization')
    expect(xhr.sent).toBe(f)
    expect(onProgress).toHaveBeenCalledWith(0.5)
  })

  it('rejects on a non-2xx status', async () => {
    const xhr = new FakeXhr()
    xhr.status = 403
    const p = putFile(
      target,
      file('image/jpeg'),
      () => {},
      () => xhr as unknown as XMLHttpRequest,
    )
    xhr.onload?.()
    await expect(p).rejects.toBeTruthy()
  })

  it('rejects on a network error', async () => {
    const xhr = new FakeXhr()
    const p = putFile(
      target,
      file('image/jpeg'),
      () => {},
      () => xhr as unknown as XMLHttpRequest,
    )
    xhr.onerror?.()
    await expect(p).rejects.toBeTruthy()
  })
})

const moment = (id: string) => ({ id }) as unknown as MomentView
const ctx = { slug: 'trip', dayId: 'd1' }

const makeDeps = (opts: { failCompleteAt?: number } = {}) => {
  let running = 0
  let maxRunning = 0
  let n = 0
  const deps = {
    startUpload: vi.fn(async () => ({ moment: moment(`m${++n}`), upload: target })),
    putFile: vi.fn(async (_t: UploadTarget, _f: File, onProgress: (x: number) => void) => {
      running++
      maxRunning = Math.max(maxRunning, running)
      onProgress(0.5)
      await new Promise((r) => setTimeout(r, 5))
      running--
    }),
    completeUpload: vi.fn(async (_slug: string, id: string) => {
      if (opts.failCompleteAt && id === `m${opts.failCompleteAt}`) {
        throw { response: { status: 400, data: { message: 'video is longer than 60 seconds' } } }
      }
      return moment(id)
    }),
  }
  return { deps, max: () => maxRunning }
}

describe('uploadAll', () => {
  it('runs at most 3 uploads at once and finishes all', async () => {
    const { deps, max } = makeDeps()
    const files = Array.from({ length: 5 }, (_, i) => file('image/jpeg', 10, `f${i}`))
    const updates: UploadItem[][] = []
    const items = await uploadAll(files, ctx, deps, (u) => updates.push(u))
    expect(items.map((i) => i.state)).toEqual(Array(5).fill('done'))
    expect(items.every((i) => i.progress === 1 && i.moment)).toBe(true)
    expect(max()).toBe(3)
    expect(updates.length).toBeGreaterThan(0)
  })

  it('sends start params derived from the file and context', async () => {
    const { deps } = makeDeps()
    await uploadAll([file('video/mp4', 99, 'v')], { ...ctx, planId: 'p1' }, deps, () => {})
    expect(deps.startUpload).toHaveBeenCalledWith('trip', {
      kind: 'video',
      content_type: 'video/mp4',
      size_bytes: 99,
      day_id: 'd1',
      plan_id: 'p1',
    })
  })

  it('a failed complete does not stop the others', async () => {
    const { deps } = makeDeps({ failCompleteAt: 2 })
    const files = Array.from({ length: 4 }, (_, i) => file('image/jpeg', 10, `f${i}`))
    const items = await uploadAll(files, ctx, deps, () => {})
    expect(items.map((i) => i.state)).toEqual(['done', 'error', 'done', 'done'])
    expect(items[1].error).toBe('วิดีโอยาวเกิน 60 วินาที')
  })

  it('marks invalid files as errors without calling the API', async () => {
    const { deps } = makeDeps()
    const items = await uploadAll([file('image/gif', 1, 'a.gif')], ctx, deps, () => {})
    expect(items[0]).toMatchObject({ state: 'error', error: 'ไฟล์ชนิดนี้ใช้ไม่ได้' })
    expect(deps.startUpload).not.toHaveBeenCalled()
  })

  it('files beyond 20 are errors', async () => {
    const { deps } = makeDeps()
    const files = Array.from({ length: 21 }, (_, i) => file('image/jpeg', 10, `f${i}`))
    const items = await uploadAll(files, ctx, deps, () => {})
    expect(items).toHaveLength(21)
    expect(items.slice(0, 20).every((i) => i.state === 'done')).toBe(true)
    expect(items[20]).toMatchObject({ state: 'error', error: 'เลือกได้ครั้งละไม่เกิน 20 ไฟล์' })
    expect(deps.startUpload).toHaveBeenCalledTimes(20)
  })
})
