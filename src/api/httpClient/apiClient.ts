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

export const handleUnauthorized = (
  error: unknown,
  deps: { clearToken: () => void; dispatch: (eventName: string) => void },
): Promise<never> => {
  const status = (error as { response?: { status?: number } } | null)?.response?.status
  if (status === 401) {
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
      dispatch: (name) => {
        if (isBrowser()) window.dispatchEvent(new Event(name))
      },
    }),
)
