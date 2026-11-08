import axios, { type InternalAxiosRequestConfig } from 'axios'

import { clearToken, getToken } from '@/lib/session'

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
  config?: { headers?: Record<string, unknown> & { get?: (name: string) => unknown } }
} | null

const sentToken = (error: FailedRequest): string | null => {
  const headers = error?.config?.headers
  const header =
    typeof headers?.get === 'function' ? headers.get('Authorization') : headers?.Authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length) || null
}

// A 401 only ends the session it was sent with. If the stored token changed since the
// request left (a login replaced it, or logout cleared it), the 401 is about an old session
// and must not wipe the new one or bounce the user to the login page.
export const handleUnauthorized = (
  error: unknown,
  deps: {
    clearToken: () => void
    dispatch: (eventName: string) => void
    getToken: () => string | null
  },
): Promise<never> => {
  const failed = error as FailedRequest
  if (failed?.response?.status === 401 && sentToken(failed) === deps.getToken()) {
    deps.clearToken()
    deps.dispatch(UNAUTHORIZED_EVENT)
  }
  return Promise.reject(error)
}

const isBrowser = () => typeof window !== 'undefined'

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => withAuthHeader(config, getToken, isBrowser()))

apiClient.interceptors.response.use(
  (response) => response,
  (error) =>
    handleUnauthorized(error, {
      clearToken,
      getToken,
      dispatch: (name) => {
        if (isBrowser()) window.dispatchEvent(new Event(name))
      },
    }),
)
