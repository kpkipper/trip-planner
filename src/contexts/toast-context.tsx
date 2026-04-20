'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import AppSnackbar from '@/components/snackbar'

interface ToastContextValue {
  showToast: (message: string, severity?: 'success' | 'error') => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const showToast = useCallback((message: string, severity: 'success' | 'error' = 'success') => {
    setToast({ message, severity })
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AppSnackbar
        open={!!toast}
        message={toast?.message ?? ''}
        severity={toast?.severity}
        onClose={() => setToast(null)}
      />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
