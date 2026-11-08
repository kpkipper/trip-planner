import { describe, expect, it } from 'vitest'

import { clearToken, getToken, setToken } from './session'

describe('session without window', () => {
  it('is safe to call when window is undefined', () => {
    expect(typeof window).toBe('undefined')
    expect(getToken()).toBeNull()
    expect(() => setToken('x')).not.toThrow()
    expect(() => clearToken()).not.toThrow()
    expect(getToken()).toBeNull()
  })
})

describe('session with storage', () => {
  const install = (storage: Partial<Storage>) =>
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: storage },
      configurable: true,
    })
  const uninstall = () => Reflect.deleteProperty(globalThis, 'window')

  it('reads, writes and clears jp.session', () => {
    const data = new Map<string, string>()
    install({
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => void data.set(k, v),
      removeItem: (k) => void data.delete(k),
    })
    try {
      setToken('tok')
      expect(data.get('jp.session')).toBe('tok')
      expect(getToken()).toBe('tok')
      clearToken()
      expect(getToken()).toBeNull()
    } finally {
      uninstall()
    }
  })

  it('swallows storage errors', () => {
    const boom = () => {
      throw new Error('denied')
    }
    install({ getItem: boom, setItem: boom, removeItem: boom })
    try {
      expect(getToken()).toBeNull()
      expect(() => setToken('x')).not.toThrow()
      expect(() => clearToken()).not.toThrow()
    } finally {
      uninstall()
    }
  })
})
