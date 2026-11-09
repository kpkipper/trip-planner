import { useEffect, useRef } from 'react'

import type { RefObject } from 'react'

// Next focus position when Tab / Shift+Tab is pressed inside a trap.
// current = -1 means focus is outside the focusable elements. Returns -1 when there are none.
export const nextFocusIndex = (current: number, count: number, shift: boolean): number => {
  if (count <= 0) return -1
  if (current < 0 || current >= count) return shift ? count - 1 : 0
  return (current + (shift ? -1 : 1) + count) % count
}

interface Styled {
  style: { overflow: string }
}

// Shared scroll lock: the first lock saves the target's own overflow and hides it, the last
// release puts it back, so a dialog opened on top of another cannot unlock early.
// Each returned release works once.
export const createScrollLock = (getTarget: () => Styled) => {
  let count = 0
  let target: Styled | null = null
  let saved = ''
  return (): (() => void) => {
    if (count === 0) {
      target = getTarget()
      saved = target.style.overflow
      target.style.overflow = 'hidden'
    }
    count++
    let released = false
    return () => {
      if (released) return
      released = true
      count--
      if (count === 0 && target) {
        target.style.overflow = saved
        target = null
      }
    }
  }
}

// The app scrolls inside <main data-scroll-root>, not the body.
const lockScroll = createScrollLock(
  () => document.querySelector<HTMLElement>('[data-scroll-root]') ?? document.body,
)

// Where focus goes when a modal closes, best first: the element that opened it, unless that is
// the body or gone (e.g. a menu item unmounted along with its menu), then the fallback.
export const returnFocusCandidates = <T extends { isConnected: boolean }>(
  opener: T | null,
  fallback: T | null | undefined,
  body: T | null,
): T[] => {
  const out: T[] = []
  if (opener && opener !== body && opener.isConnected) out.push(opener)
  if (fallback && fallback !== opener && fallback.isConnected) out.push(fallback)
  return out
}

const FOCUSABLE =
  'a[href], button, input, select, textarea, video[controls], [tabindex]:not([tabindex="-1"])'

const focusables = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !(el as HTMLButtonElement).disabled && el.tabIndex !== -1,
  )

// Focuses the first candidate that actually takes focus (a disabled button does not).
const focusFirst = (candidates: (HTMLElement | null | undefined)[]): boolean => {
  for (const el of candidates) {
    if (!el || !el.isConnected) continue
    el.focus()
    if (document.activeElement === el) return true
  }
  return false
}

interface Options {
  open: boolean
  onClose: () => void
  // Escape does nothing while false (e.g. while submitting). Default true.
  canClose?: boolean
  // False pauses Escape and the focus trap while another dialog sits on top; the scroll lock and
  // the opener are kept. On resume, focus returns to the last element focused inside. Default true.
  active?: boolean
  // Focused on open instead of the first focusable element.
  initialFocus?: RefObject<HTMLElement | null>
  // Focused on close when the opener is gone or was the body (e.g. a menu item).
  returnFocus?: RefObject<HTMLElement | null>
}

// Modal behaviour: Escape closes, Tab wraps inside `ref`, page scroll is locked,
// focus moves in on open and returns to the previous element on close.
export function useModalA11y(ref: RefObject<HTMLElement | null>, opts: Options) {
  const { open, onClose, canClose = true, active = true, initialFocus, returnFocus } = opts
  const onCloseRef = useRef(onClose)
  const canCloseRef = useRef(canClose)
  const lastFocused = useRef<HTMLElement | null>(null)
  useEffect(() => {
    onCloseRef.current = onClose
    canCloseRef.current = canClose
  })

  // Lifetime of the modal: scroll lock and focus restore. Declared first so the opener is
  // captured before focus moves in.
  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const fallback = returnFocus?.current
    lastFocused.current = null
    const release = lockScroll()
    return () => {
      release()
      focusFirst(returnFocusCandidates(opener, fallback, document.body))
    }
  }, [open, ref, returnFocus])

  // Escape and focus trap, only while this modal is the top one.
  useEffect(() => {
    if (!open || !active) return
    const root = ref.current
    const last = lastFocused.current
    lastFocused.current = null
    if (root && (last || !root.contains(document.activeElement))) {
      const resume = last && root.contains(last) ? last : null
      focusFirst([resume, initialFocus?.current, ...focusables(root)])
    }

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
      // Remember where focus was in case this is a pause, not a close.
      const current = document.activeElement
      if (root && current instanceof HTMLElement && root.contains(current)) {
        lastFocused.current = current
      }
    }
  }, [open, active, ref, initialFocus])
}
