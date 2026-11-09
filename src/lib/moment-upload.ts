import { completeUpload, startUpload } from '@/api/moments'
import { momentErrorMessage } from '@/lib/moment-errors'

import type { MomentKind, MomentView, StartUploadInput, UploadTarget } from '@/api/moments/type'

export const MAX_FILES = 20
export const CONCURRENCY = 3
export const MAX_PHOTO_BYTES = 10485760
export const MAX_VIDEO_BYTES = 104857600

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const VIDEO_TYPES = ['video/mp4', 'video/quicktime']

export interface UploadItem {
  name: string
  kind?: MomentKind
  progress: number
  state: 'queued' | 'uploading' | 'processing' | 'done' | 'error'
  error?: string
  moment?: MomentView
}

export const validateFile = (file: File): { kind: MomentKind } | { error: string } => {
  const kind: MomentKind | null = PHOTO_TYPES.includes(file.type)
    ? 'photo'
    : VIDEO_TYPES.includes(file.type)
      ? 'video'
      : null
  if (!kind) return { error: 'ไฟล์ชนิดนี้ใช้ไม่ได้' }
  const max = kind === 'photo' ? MAX_PHOTO_BYTES : MAX_VIDEO_BYTES
  if (file.size > max) return { error: 'ไฟล์ใหญ่เกินไป' }
  return { kind }
}

// The storage URL is cross-origin (and signed): use a bare XHR and send only the headers the
// backend told us to. Never the Authorization token.
export const putFile = (
  target: UploadTarget,
  file: File,
  onProgress: (fraction: number) => void,
  xhrFactory: () => XMLHttpRequest = () => new XMLHttpRequest(),
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = xhrFactory()
    xhr.open(target.method, target.url)
    for (const [name, value] of Object.entries(target.headers ?? {})) {
      xhr.setRequestHeader(name, value)
    }
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) onProgress(e.loaded / e.total)
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else reject(new Error(`upload failed with status ${xhr.status}`))
    }
    xhr.onerror = () => reject(new Error('upload failed'))
    xhr.send(file)
  })

export interface UploadContext {
  slug: string
  dayId: string
  planId?: string
}

export interface UploadDeps {
  startUpload: typeof startUpload
  putFile: typeof putFile
  completeUpload: typeof completeUpload
}

const defaultDeps: UploadDeps = { startUpload, putFile, completeUpload }

// start -> PUT -> complete for each file, CONCURRENCY at a time. A failing file is marked
// 'error' and never stops the others. The result is in the same order as `files`.
export const uploadAll = async (
  files: File[],
  ctx: UploadContext,
  deps: UploadDeps = defaultDeps,
  onUpdate: (items: UploadItem[]) => void = () => {},
): Promise<UploadItem[]> => {
  const items: UploadItem[] = files.map((f) => ({ name: f.name, progress: 0, state: 'queued' }))
  const emit = () => onUpdate(items.map((i) => ({ ...i })))
  const patch = (i: number, p: Partial<UploadItem>) => {
    items[i] = { ...items[i], ...p }
    emit()
  }

  const jobs: number[] = []
  files.forEach((file, i) => {
    if (i >= MAX_FILES) {
      items[i] = { ...items[i], state: 'error', error: 'เลือกได้ครั้งละไม่เกิน 20 ไฟล์' }
      return
    }
    const checked = validateFile(file)
    if ('error' in checked) {
      items[i] = { ...items[i], state: 'error', error: checked.error }
      return
    }
    items[i] = { ...items[i], kind: checked.kind }
    jobs.push(i)
  })
  emit()

  const run = async (i: number) => {
    const file = files[i]
    try {
      patch(i, { state: 'uploading' })
      const input: StartUploadInput = {
        kind: items[i].kind as MomentKind,
        content_type: file.type,
        size_bytes: file.size,
        day_id: ctx.dayId,
        ...(ctx.planId ? { plan_id: ctx.planId } : {}),
      }
      const { moment: pending, upload } = await deps.startUpload(ctx.slug, input)
      await deps.putFile(upload, file, (fraction) => patch(i, { progress: fraction }))
      patch(i, { state: 'processing', progress: 1 })
      const moment = await deps.completeUpload(ctx.slug, pending.id)
      patch(i, { state: 'done', moment })
    } catch (err) {
      patch(i, { state: 'error', error: momentErrorMessage(err) })
    }
  }

  let next = 0
  const worker = async () => {
    while (next < jobs.length) await run(jobs[next++])
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker))
  return items
}
