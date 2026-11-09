import { uploadAll, type UploadContext, type UploadItem } from '@/lib/moment-upload'

export const uploadKey = (dayId: string, planId?: string): string =>
  planId ? `${dayId}:${planId}` : dayId

type Run = (
  files: File[],
  ctx: UploadContext,
  deps: undefined,
  onUpdate: (items: UploadItem[]) => void,
) => Promise<UploadItem[]>

interface Options {
  run?: Run
  // Called once after each batch finishes (some files may have failed).
  onBatchDone?: () => void
}

const NONE: UploadItem[] = []

// Upload state for one trip, outside React so it survives day-tab switches. Keyed by
// dayId + optional planId. uploadAll stays the engine.
export const createUploadStore = ({ run = uploadAll as Run, onBatchDone }: Options = {}) => {
  let batchDone = onBatchDone
  const items = new Map<string, UploadItem[]>()
  const busy = new Map<string, string>() // key -> dayId
  const listeners = new Set<() => void>()
  const emit = () => listeners.forEach((l) => l())

  return {
    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    getItems: (key: string): UploadItem[] => items.get(key) ?? NONE,
    isBusy: (key: string): boolean => busy.has(key),
    anyBusy: (): boolean => busy.size > 0,
    busyDayIds: (): Set<string> => new Set(busy.values()),
    // Lets the owner (React) point the callback at the latest reload without recreating the store.
    setOnBatchDone(fn: (() => void) | undefined) {
      batchDone = fn
    },
    dismiss(key: string) {
      if (busy.has(key) || !items.has(key)) return
      items.delete(key)
      emit()
    },
    async start(ctx: UploadContext, files: File[]): Promise<void> {
      const key = uploadKey(ctx.dayId, ctx.planId)
      if (busy.has(key) || files.length === 0) return
      busy.set(key, ctx.dayId)
      items.set(key, [])
      emit()
      try {
        const final = await run(files, ctx, undefined, (next) => {
          items.set(key, next)
          emit()
        })
        items.set(key, final)
      } catch (err) {
        console.error('Upload batch failed:', err instanceof Error ? err.message : 'unknown')
      } finally {
        busy.delete(key)
        emit()
        batchDone?.()
      }
    },
  }
}

export type UploadStore = ReturnType<typeof createUploadStore>
