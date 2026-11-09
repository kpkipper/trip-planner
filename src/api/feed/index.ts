import { apiClient } from '@/api/httpClient/apiClient'

import type { Envelope, FeedPage, NowTraveler } from './type'

export const getFeed = async (before?: string, limit?: number): Promise<FeedPage> => {
  const params: Record<string, string | number> = {}
  if (before) params.before = before
  if (limit !== undefined) params.limit = limit
  const { data } = await apiClient.get<Envelope<FeedPage>>('/api/v1/feed', { params })
  return { items: data.data?.items ?? [], next_before: data.data?.next_before ?? null }
}

export const getNowTravelers = async () => {
  const { data } = await apiClient.get<Envelope<{ travelers: NowTraveler[] }>>('/api/v1/feed/now')
  return data.data?.travelers ?? []
}
