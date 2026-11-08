'use client'

import { createContext, useCallback, useContext, useState } from 'react'

import AppSnackbar, { type SnackbarAction } from '@/components/snackbar'

interface ToastContextValue {
  showToast: (
    message: string,
    severity?: 'success' | 'error',
    options?: { action?: SnackbarAction },
  ) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{
    message: string
    severity: 'success' | 'error'
    action?: SnackbarAction
  } | null>(null)

  const showToast = useCallback<ToastContextValue['showToast']>(
    (message, severity = 'success', options) => {
      setToast({ message, severity, action: options?.action })
    },
    [],
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <AppSnackbar
        open={!!toast}
        message={toast?.message ?? ''}
        severity={toast?.severity}
        action={toast?.action}
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
