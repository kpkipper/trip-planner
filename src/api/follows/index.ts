import { apiClient } from '@/api/httpClient/apiClient'

import type { FollowEntry } from './type'
import type { Envelope } from '@/api/profile/type'

const seg = encodeURIComponent

export const listFollowRequests = async (options: { skipAuthRedirect?: boolean } = {}) => {
  const { data } = await apiClient.get<Envelope<{ items: FollowEntry[] | null; count: number }>>(
    '/api/v1/me/follow-requests',
    options,
  )
  return { items: data.data?.items ?? [], count: data.data?.count ?? 0 }
}

export const acceptFollowRequest = async (username: string) => {
  await apiClient.post(`/api/v1/me/follow-requests/${seg(username)}/accept`)
}

export const declineFollowRequest = async (username: string) => {
  await apiClient.delete(`/api/v1/me/follow-requests/${seg(username)}`)
}

export const listFollowers = async () => {
  const { data } =
    await apiClient.get<Envelope<{ items: FollowEntry[] | null }>>('/api/v1/me/followers')
  return data.data?.items ?? []
}

export const removeFollower = async (username: string) => {
  await apiClient.delete(`/api/v1/me/followers/${seg(username)}`)
}
