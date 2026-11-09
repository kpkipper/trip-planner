import { useEffect, useRef } from 'react'

import type { RefObject } from 'react'

// Next focus position when Tab / Shift+Tab is pressed inside a trap.
// current = -1 means focus is outside the focusable elements. Returns -1 when there are none.
export const nextFocusIndex = (current: number, count: number, shift: boolean): number => {
  if (count <= 0) return -1
  if (current < 0 || current >= count) return shift ? count - 1 : 0
  return (current + (shift ? -1 : 1) + count) % count
}

const FOCUSABLE =
  'a[href], button, input, select, textarea, video[controls], [tabindex]:not([tabindex="-1"])'

const focusables = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !(el as HTMLButtonElement).disabled && el.tabIndex !== -1,
  )

interface Options {
  open: boolean
  onClose: () => void
  // Escape does nothing while false (e.g. while submitting). Default true.
  canClose?: boolean
}

// Modal behaviour: Escape closes, Tab wraps inside `ref`, body scroll is locked,
// focus moves in on open and returns to the previous element on close.
export function useModalA11y(ref: RefObject<HTMLElement | null>, opts: Options) {
  const { open, onClose, canClose = true } = opts
  const onCloseRef = useRef(onClose)
  const canCloseRef = useRef(canClose)
  useEffect(() => {
    onCloseRef.current = onClose
    canCloseRef.current = canClose
  })

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const root = ref.current
    if (root && !root.contains(document.activeElement)) {
      focusables(root)[0]?.focus()
    }

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (canCloseRef.current) {
          e.preventDefault()
          onCloseRef.current()
        }
        return
      }
      if (e.key !== 'Tab' || !ref.current) return
      const list = focusables(ref.current)
      if (list.length === 0) {
        e.preventDefault()
        return
      }
      const idx = nextFocusIndex(
        list.indexOf(document.activeElement as HTMLElement),
        list.length,
        e.shiftKey,
      )
      e.preventDefault()
      list[idx].focus()
    }
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      if (opener && document.contains(opener)) opener.focus()
    }
  }, [open, ref])
}
