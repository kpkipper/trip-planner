import { describe, expect, it } from 'vitest'

import { createScrollLock, nextFocusIndex, returnFocusCandidates } from './use-modal-a11y'

describe('nextFocusIndex', () => {
  it('moves forward and wraps to the first', () => {
    expect(nextFocusIndex(0, 3, false)).toBe(1)
    expect(nextFocusIndex(2, 3, false)).toBe(0)
  })
  it('moves back and wraps to the last', () => {
    expect(nextFocusIndex(2, 3, true)).toBe(1)
    expect(nextFocusIndex(0, 3, true)).toBe(2)
  })
  it('enters the trap from outside', () => {
    expect(nextFocusIndex(-1, 3, false)).toBe(0)
    expect(nextFocusIndex(-1, 3, true)).toBe(2)
  })
  it('handles a single element and no elements', () => {
    expect(nextFocusIndex(0, 1, false)).toBe(0)
    expect(nextFocusIndex(0, 1, true)).toBe(0)
    expect(nextFocusIndex(-1, 0, false)).toBe(-1)
  })
})

describe('createScrollLock', () => {
  const setup = (initial = 'auto') => {
    const el = { style: { overflow: initial } }
    let calls = 0
    const lock = createScrollLock(() => {
      calls++
      return el
    })
    return { el, lock, calls: () => calls }
  }

  it('hides overflow and restores the saved value', () => {
    const { el, lock } = setup('scroll')
    const release = lock()
    expect(el.style.overflow).toBe('hidden')
    release()
    expect(el.style.overflow).toBe('scroll')
  })
  it('stays locked until the last nested lock is released', () => {
    const { el, lock, calls } = setup('')
    const outer = lock()
    const inner = lock()
    outer()
    expect(el.style.overflow).toBe('hidden')
    inner()
    expect(el.style.overflow).toBe('')
    expect(calls()).toBe(1)
  })
  it('ignores a repeated release', () => {
    const { el, lock } = setup('')
    const a = lock()
    const b = lock()
    a()
    a()
    expect(el.style.overflow).toBe('hidden')
    b()
    expect(el.style.overflow).toBe('')
  })
  it('saves afresh on the next first lock', () => {
    const { el, lock } = setup('')
    lock()()
    el.style.overflow = 'clip'
    const release = lock()
    expect(el.style.overflow).toBe('hidden')
    release()
    expect(el.style.overflow).toBe('clip')
  })
})

describe('returnFocusCandidates', () => {
  const body = { isConnected: true, name: 'body' }
  const opener = { isConnected: true, name: 'opener' }
  const trigger = { isConnected: true, name: 'trigger' }
  const gone = { isConnected: false, name: 'gone' }

  it('prefers the opener, then the fallback', () => {
    expect(returnFocusCandidates(opener, trigger, body)).toEqual([opener, trigger])
  })
  it('skips the body and disconnected openers', () => {
    expect(returnFocusCandidates(body, trigger, body)).toEqual([trigger])
    expect(returnFocusCandidates(gone, trigger, body)).toEqual([trigger])
    expect(returnFocusCandidates(null, trigger, body)).toEqual([trigger])
  })
  it('returns nothing usable when both are missing or gone', () => {
    expect(returnFocusCandidates(body, undefined, body)).toEqual([])
    expect(returnFocusCandidates(gone, gone, body)).toEqual([])
  })
  it('does not list the same element twice', () => {
    expect(returnFocusCandidates(trigger, trigger, body)).toEqual([trigger])
  })
})
