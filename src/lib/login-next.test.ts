import { afterEach, describe, expect, it } from 'vitest'

import { consumeLoginNext, LOGIN_NEXT_MAX_AGE_MS, storeLoginNext } from './login-next'

const data = new Map<string, string>()
const install = (extra: Partial<Storage> = {}) =>
  Object.defineProperty(globalThis, 'window', {
    value: {
      localStorage: {
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => void data.set(k, v),
        removeItem: (k: string) => void data.delete(k),
        ...extra,
      },
    },
    configurable: true,
  })

afterEach(() => {
  data.clear()
  Reflect.deleteProperty(globalThis, 'window')
})

describe('login next', () => {
  it('stores and reads back a safe destination once', () => {
    install()
    storeLoginNext('/plans/tokyo?a=1', 1000)
    expect(JSON.parse(data.get('jp.loginNext')!)).toEqual({ next: '/plans/tokyo?a=1', at: 1000 })
    expect(consumeLoginNext(2000)).toBe('/plans/tokyo?a=1')
    expect(data.has('jp.loginNext')).toBe(false)
    expect(consumeLoginNext(2000)).toBe('/')
  })

  it('sanitizes the destination when storing and when reading', () => {
    install()
    storeLoginNext('//evil.com', 1000)
    expect(consumeLoginNext(1000)).toBe('/')
    data.set('jp.loginNext', JSON.stringify({ next: 'https://evil.com', at: 1000 }))
    expect(consumeLoginNext(1000)).toBe('/')
  })

  it('ignores an entry older than 30 minutes (and clears it)', () => {
    install()
    storeLoginNext('/plans/tokyo', 0)
    expect(consumeLoginNext(LOGIN_NEXT_MAX_AGE_MS + 1)).toBe('/')
    expect(data.has('jp.loginNext')).toBe(false)
    storeLoginNext('/plans/tokyo', 0)
    expect(consumeLoginNext(LOGIN_NEXT_MAX_AGE_MS)).toBe('/plans/tokyo')
  })

  it('treats garbage as no destination', () => {
    install()
    for (const raw of ['not json', 'null', '42', '{}', '{"next":5,"at":1}', '{"next":"/x"}']) {
      data.set('jp.loginNext', raw)
      expect(consumeLoginNext(10)).toBe('/')
    }
  })

  it('is safe without window or with throwing storage', () => {
    expect(() => storeLoginNext('/x')).not.toThrow()
    expect(consumeLoginNext()).toBe('/')
    const boom = () => {
      throw new Error('denied')
    }
    install({ getItem: boom, setItem: boom, removeItem: boom })
    expect(() => storeLoginNext('/x')).not.toThrow()
    expect(consumeLoginNext()).toBe('/')
  })
})
