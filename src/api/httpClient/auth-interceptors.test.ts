import axios, { AxiosHeaders, type InternalAxiosRequestConfig } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import { handleUnauthorized, installAuthInterceptors, UNAUTHORIZED_EVENT } from './apiClient'

import type { AxiosAdapter } from 'axios'

// A tiny in-memory session + an axios instance whose adapter answers per URL.
const setup = (initialToken: string | null, statusFor: (url: string) => number) => {
  let token = initialToken
  const store = {
    getToken: () => token,
    setToken: (t: string) => {
      token = t
    },
    clearToken: vi.fn(() => {
      token = null
    }),
  }
  const dispatch = vi.fn()
  const pending: Array<() => void> = []
  let hold = false
  const adapter: AxiosAdapter = (config) =>
    new Promise((resolve, reject) => {
      const answer = () => {
        const status = statusFor(config.url ?? '')
        const response = { data: {}, status, statusText: '', headers: {}, config }
        if (status >= 400) {
          reject(
            Object.assign(new Error(`status ${status}`), { isAxiosError: true, config, response }),
          )
        } else resolve(response)
      }
      if (hold) pending.push(answer)
      else answer()
    })
  const instance = axios.create({ adapter })
  installAuthInterceptors(instance, {
    getToken: store.getToken,
    clearToken: store.clearToken,
    dispatch,
    isBrowser: () => true,
  })
  return {
    instance,
    store,
    dispatch,
    holdResponses: () => {
      hold = true
    },
    // Request interceptors run asynchronously: wait until n requests reached the adapter.
    waitForPending: async (n: number) => {
      while (pending.length < n) await new Promise((r) => setTimeout(r, 0))
    },
    release: () => pending.splice(0).forEach((answer) => answer()),
    releaseOne: () => pending.shift()?.(),
    releaseLast: () => pending.pop()?.(),
  }
}

describe('installAuthInterceptors', () => {
  it('hydrate getMe 401 (skipAuthRedirect): clears the stale token, no redirect event', async () => {
    const t = setup('stale', () => 401)
    await expect(t.instance.get('/api/v1/me', { skipAuthRedirect: true })).rejects.toBeTruthy()
    expect(t.store.getToken()).toBeNull()
    expect(t.dispatch).not.toHaveBeenCalled()
  })

  it('concurrent 401s during loading: a login-only fetch still fires the redirect event', async () => {
    const t = setup('expired', () => 401)
    t.holdResponses()
    const me = t.instance.get('/api/v1/me', { skipAuthRedirect: true })
    const mine = t.instance.get('/api/v1/me/journeys')
    await t.waitForPending(2)
    t.release()
    await expect(me).rejects.toBeTruthy()
    await expect(mine).rejects.toBeTruthy()
    expect(t.store.getToken()).toBeNull()
    expect(t.dispatch).toHaveBeenCalledTimes(1)
    expect(t.dispatch).toHaveBeenCalledWith(UNAUTHORIZED_EVENT)
  })

  it('two concurrent login-only 401s with the same token both report (second has nothing to clear)', async () => {
    const t = setup('expired', () => 401)
    t.holdResponses()
    const a = t.instance.get('/api/v1/me/journeys')
    const b = t.instance.get('/api/v1/me/invites')
    await t.waitForPending(2)
    t.release()
    await Promise.allSettled([a, b])
    expect(t.store.clearToken).toHaveBeenCalledTimes(1)
    expect(t.dispatch).toHaveBeenCalledTimes(2)
  })

  it('stale /me 401 after a fresh login is ignored and keeps the new session', async () => {
    const t = setup('stale', () => 401)
    t.holdResponses()
    const me = t.instance.get('/api/v1/me', { skipAuthRedirect: true })
    await t.waitForPending(1)
    t.store.setToken('fresh') // verify page logged in while /me was in flight
    t.release()
    await expect(me).rejects.toBeTruthy()
    expect(t.store.getToken()).toBe('fresh')
    expect(t.store.clearToken).not.toHaveBeenCalled()
    expect(t.dispatch).not.toHaveBeenCalled()
  })

  it('a 401 for the old token after a 401-clear and a new login is ignored', async () => {
    const t = setup('old', () => 401)
    t.holdResponses()
    const first = t.instance.get('/api/v1/me/journeys')
    const second = t.instance.get('/api/v1/me/invites')
    await t.waitForPending(2)
    t.releaseOne()
    await first.catch(() => {})
    t.store.setToken('fresh') // user logged in again before the second response arrived
    t.releaseOne()
    await second.catch(() => {})
    expect(t.store.getToken()).toBe('fresh')
    expect(t.dispatch).toHaveBeenCalledTimes(1)
  })

  it('forgets the 401-cleared token once a newer session is used (late 401 after re-login + logout)', async () => {
    const t = setup('old', (url) => (url === '/ok' ? 200 : 401))
    t.holdResponses()
    const first = t.instance.get('/api/v1/me/journeys')
    const late = t.instance.get('/api/v1/me/invites')
    await t.waitForPending(2)
    t.releaseOne()
    await first.catch(() => {})
    expect(t.dispatch).toHaveBeenCalledTimes(1)
    t.store.setToken('fresh') // logged in again
    const ok = t.instance.get('/ok')
    await t.waitForPending(2)
    t.releaseLast()
    await ok
    t.store.clearToken() // explicit logout
    t.releaseOne() // the 'old' 401 finally arrives
    await late.catch(() => {})
    expect(t.dispatch).toHaveBeenCalledTimes(1)
  })

  it('logout request (skipAuthRedirect, token cleared before sending) never redirects', async () => {
    const t = setup('session', () => 401)
    t.store.clearToken()
    await expect(
      t.instance.post(
        '/api/v1/auth/logout',
        {},
        { headers: { Authorization: 'Bearer session' }, skipAuthRedirect: true },
      ),
    ).rejects.toBeTruthy()
    expect(t.dispatch).not.toHaveBeenCalled()
  })
})

describe('handleUnauthorized with real AxiosHeaders', () => {
  it('reads the bearer token from an AxiosHeaders instance', async () => {
    const config = {
      headers: new AxiosHeaders({ Authorization: 'Bearer current' }),
    } as InternalAxiosRequestConfig
    const error = { response: { status: 401 }, config }
    const clearToken = vi.fn()
    const dispatch = vi.fn()
    await expect(
      handleUnauthorized(error, {
        clearToken,
        dispatch,
        getToken: () => 'current',
        lastCleared: { current: null },
      }),
    ).rejects.toBe(error)
    expect(clearToken).toHaveBeenCalledTimes(1)
    expect(dispatch).toHaveBeenCalledWith(UNAUTHORIZED_EVENT)
  })
})
