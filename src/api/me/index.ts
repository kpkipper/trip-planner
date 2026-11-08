import { apiClient } from '@/api/httpClient/apiClient'

import type { GetMeResponse, ProfilePatch } from './type'

export const getMe = async () => {
  const { data } = await apiClient.get<GetMeResponse>('/api/v1/me')
  return data.data
}

export const updateMe = async (patch: ProfilePatch) => {
  const { data } = await apiClient.patch<GetMeResponse>('/api/v1/me', patch)
  return data.data
}
