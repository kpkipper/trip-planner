'use client'

import { createContext, useContext, useEffect, useSyncExternalStore } from 'react'

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

// Small marker for day tabs that have uploads in flight.
export function DayUploadingMark({ dayId }: { dayId: string }) {
  const store = useUploadStore()
  const busy = useSyncExternalStore(
    store.subscribe,
    () => store.busyDayIds().has(dayId),
    () => false,
  )
  if (!busy) return null
  return <div className="text-[10px] font-normal text-[#0163a4]">กำลังอัปโหลด…</div>
}
