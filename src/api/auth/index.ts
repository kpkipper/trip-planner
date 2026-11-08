import { apiClient } from '@/api/httpClient/apiClient'

import type { EmptyResponse, LoginResponse } from './type'

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
// interceptor has nothing to attach.
export const logout = async (sessionToken: string) => {
  const { data } = await apiClient.post<EmptyResponse>(
    '/api/v1/auth/logout',
    {},
    { headers: { Authorization: `Bearer ${sessionToken}` } },
  )
  return data
}
