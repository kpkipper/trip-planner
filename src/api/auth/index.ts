import { apiClient } from '@/api/httpClient/apiClient'

import type { EmptyResponse, LoginMethods, LoginMethodsResponse, LoginResponse } from './type'

// Short timeout: the login page waits for this before showing any button.
export const getLoginMethods = async (): Promise<LoginMethods> => {
  const { data } = await apiClient.get<LoginMethodsResponse>('/api/v1/auth/methods', {
    timeout: 5000,
  })
  const m = data?.data
  if (typeof m?.email !== 'boolean' || typeof m?.google !== 'boolean') {
    throw new Error('unexpected /auth/methods response')
  }
  return { email: m.email, google: m.google }
}

export const loginWithGoogle = async (idToken: string) => {
  const { data } = await apiClient.post<LoginResponse>('/api/v1/auth/google', { id_token: idToken })
  return data.data
}

export const startEmailLogin = async (email: string) => {
  const { data } = await apiClient.post<EmptyResponse>('/api/v1/auth/email/start', { email })
  return data
}

export const verifyEmailLogin = async (token: string) => {
  const { data } = await apiClient.post<LoginResponse>('/api/v1/auth/email/verify', { token })
  return data.data
}

// Takes the session token explicitly: the caller clears the stored token first, so the
// interceptor has nothing to attach. A 401 here (already expired) must not redirect.
export const logout = async (sessionToken: string) => {
  const { data } = await apiClient.post<EmptyResponse>(
    '/api/v1/auth/logout',
    {},
    { headers: { Authorization: `Bearer ${sessionToken}` }, skipAuthRedirect: true },
  )
  return data
}
