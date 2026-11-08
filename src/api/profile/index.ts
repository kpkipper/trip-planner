import { apiClient } from '@/api/httpClient/apiClient'

import type { Envelope, FollowState, ProfileView } from './type'

const path = (username: string) => `/api/v1/users/${encodeURIComponent(username)}`

export const getProfile = async (username: string) => {
  const { data } = await apiClient.get<Envelope<ProfileView>>(`${path(username)}/profile`)
  return data.data
}

export const followUser = async (username: string) => {
  const { data } = await apiClient.post<Envelope<FollowState>>(`${path(username)}/follow`)
  return data.data
}

export const unfollowUser = async (username: string) => {
  const { data } = await apiClient.delete<Envelope<FollowState>>(`${path(username)}/follow`)
  return data.data
}
