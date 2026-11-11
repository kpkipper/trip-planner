'use client'

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'

import { Loader2 } from 'lucide-react'

import { uploadKey, type UploadStore } from '@/lib/upload-store'

const UploadStoreContext = createContext<UploadStore | null>(null)

// Provides the trip-level upload store and warns before leaving the page mid-upload.
export function UploadStoreProvider({
  store,
  children,
}: {
  store: UploadStore
  children: React.ReactNode
}) {
  const busy = useSyncExternalStore(store.subscribe, store.anyBusy, () => false)
  useEffect(() => {
    if (!busy) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [busy])
  return <UploadStoreContext.Provider value={store}>{children}</UploadStoreContext.Provider>
}

export function useUploadStore(): UploadStore {
  const store = useContext(UploadStoreContext)
  if (!store) throw new Error('useUploadStore must be used inside UploadStoreProvider')
  return store
}

// Items and busy flag of one day/plan uploader.
export function useUploads(dayId: string, planId?: string) {
  const store = useUploadStore()
  const key = uploadKey(dayId, planId)
  const items = useSyncExternalStore(
    store.subscribe,
    () => store.getItems(key),
    () => store.getItems(key),
  )
  const busy = useSyncExternalStore(
    store.subscribe,
    () => store.isBusy(key),
    () => false,
  )
  return { items, busy, store, key }
}

// Small marker for day chips that have uploads in flight (inherits the chip's text colour).
// It sits inside the chip's <button>, so it is phrasing content only. The label is screen-reader
// text: shown, it would widen the narrow date chip; the spinner says it visually. It sits in the
// chip's top-right corner (the chip is `relative`), so the chip keeps its size.
export function DayUploadingMark({ dayId }: { dayId: string }) {
  const store = useUploadStore()
  const busy = useSyncExternalStore(
    store.subscribe,
    () => store.busyDayIds().has(dayId),
    () => false,
  )
  if (!busy) return null
  return (
    <span className="absolute top-1 right-1 opacity-80" title="กำลังอัปโหลด…">
      <Loader2 size={12} className="animate-spin motion-reduce:animate-none" aria-hidden />
      <span className="sr-only">กำลังอัปโหลด…</span>
    </span>
  )
}
