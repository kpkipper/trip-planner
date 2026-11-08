import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

import { clearToken, getToken } from '@/lib/session'

declare module 'axios' {
  interface AxiosRequestConfig {
    // A 401 on this request must not send the user to the login page (session hydration,
    // logout). The stale token is still cleared.
    skipAuthRedirect?: boolean
  }
}

export const UNAUTHORIZED_EVENT = 'jp:unauthorized'

export const withAuthHeader = (
  config: InternalAxiosRequestConfig,
  getTokenFn: () => string | null,
  isBrowser: boolean,
): InternalAxiosRequestConfig => {
  if (!isBrowser) return config
  const token = getTokenFn()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
}

type FailedRequest = {
  response?: { status?: number }
  config?: {
    headers?: Record<string, unknown> & { get?: (name: string) => unknown }
    skipAuthRedirect?: boolean
  }
} | null

const sentToken = (error: FailedRequest): string | null => {
  const headers = error?.config?.headers
  const header =
    typeof headers?.get === 'function' ? headers.get('Authorization') : headers?.Authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length) || null
}

// A 401 only ends the session it was sent with:
// - sent token == stored token: clear it (remembering it as "cleared by a 401") and report.
// - stored token is gone and the sent token is the one a 401 just cleared: a concurrent
//   request of the same expired session, so report too (nothing left to clear).
// - otherwise the stored token changed since the request left (a login replaced it, or
//   logout cleared it): the 401 is about an old session; ignore it.
// Requests marked skipAuthRedirect still clear the token but never report.
export const handleUnauthorized = (
  error: unknown,
  deps: {
    clearToken: () => void
    dispatch: (eventName: string) => void
    getToken: () => string | null
    lastCleared: { current: string | null }
  },
): Promise<never> => {
  const failed = error as FailedRequest
  if (failed?.response?.status !== 401) return Promise.reject(error)

  const sent = sentToken(failed)
  const current = deps.getToken()
  let report = false
  if (sent === current) {
    deps.clearToken()
    if (current) deps.lastCleared.current = current
    report = true
  } else if (current === null && sent !== null && sent === deps.lastCleared.current) {
    report = true
  }
  if (report && !failed?.config?.skipAuthRedirect) deps.dispatch(UNAUTHORIZED_EVENT)
  return Promise.reject(error)
}

export interface AuthInterceptorDeps {
  getToken: () => string | null
  clearToken: () => void
  dispatch: (eventName: string) => void
  isBrowser: () => boolean
}

export const installAuthInterceptors = (instance: AxiosInstance, deps: AuthInterceptorDeps) => {
  const lastCleared = { current: null as string | null }
  instance.interceptors.request.use((config) => {
    const withAuth = withAuthHeader(config, deps.getToken, deps.isBrowser())
    // A newer session is in use: late 401s for the token a 401 cleared are stale now.
    const token = deps.isBrowser() ? deps.getToken() : null
    if (token && token !== lastCleared.current) lastCleared.current = null
    return withAuth
  })
  instance.interceptors.response.use(
    (response) => response,
    (error) => handleUnauthorized(error, { ...deps, lastCleared }),
  )
}

const isBrowser = () => typeof window !== 'undefined'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
})

installAuthInterceptors(apiClient, {
  getToken,
  clearToken,
  isBrowser,
  dispatch: (name) => {
    if (isBrowser()) window.dispatchEvent(new Event(name))
  },
})
