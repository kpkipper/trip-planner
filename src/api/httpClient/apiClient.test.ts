import { describe, expect, it, vi } from 'vitest'

import { handleUnauthorized, UNAUTHORIZED_EVENT, withAuthHeader } from './apiClient'

import type { InternalAxiosRequestConfig } from 'axios'

const makeConfig = () => ({ headers: {} as Record<string, string> }) as InternalAxiosRequestConfig

describe('withAuthHeader', () => {
  it('does not attach a header when not in a browser (build time)', () => {
    const getToken = vi.fn(() => 'secret')
    const config = withAuthHeader(makeConfig(), getToken, false)
    expect(config.headers.Authorization).toBeUndefined()
    expect(getToken).not.toHaveBeenCalled()
  })

  it('attaches a bearer token in the browser when a token exists', () => {
    const config = withAuthHeader(makeConfig(), () => 'abc', true)
    expect(config.headers.Authorization).toBe('Bearer abc')
  })

  it('attaches nothing when there is no token', () => {
    const config = withAuthHeader(makeConfig(), () => null, true)
    expect(config.headers.Authorization).toBeUndefined()
  })
})

describe('handleUnauthorized', () => {
  const deps = () => ({ clearToken: vi.fn(), dispatch: vi.fn() })

  it('clears the token, dispatches the event and rejects on 401', async () => {
    const d = deps()
    const error = { response: { status: 401 } }
    await expect(handleUnauthorized(error, d)).rejects.toBe(error)
    expect(d.clearToken).toHaveBeenCalledTimes(1)
    expect(d.dispatch).toHaveBeenCalledTimes(1)
    expect(d.dispatch.mock.calls[0][0]).toBe(UNAUTHORIZED_EVENT)
  })

  it('leaves other errors untouched', async () => {
    const d = deps()
    const error = { response: { status: 500 } }
    await expect(handleUnauthorized(error, d)).rejects.toBe(error)
    const noResponse = new Error('network')
    await expect(handleUnauthorized(noResponse, d)).rejects.toBe(noResponse)
    expect(d.clearToken).not.toHaveBeenCalled()
    expect(d.dispatch).not.toHaveBeenCalled()
  })
})
