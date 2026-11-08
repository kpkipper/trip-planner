import { apiClient } from '@/api/httpClient/apiClient'

import { toJourneyPayload } from './mapper'

import type {
  CreateJourneyResponse,
  GetJourneyTripResponse,
  GetListJourneyResponse,
  GetMyJourneysResponse,
  Response,
} from './type'
import type { Trip } from '@/types/trip'

export const getJourneys = async () => {
  const { data } = await apiClient.get<GetListJourneyResponse>(`/api/v1/journeys`)
  return data
}

export const getJourneyBySlug = async (slug: string) => {
  const { data } = await apiClient.get<GetJourneyTripResponse>(
    `/api/v1/journeys/${encodeURIComponent(slug)}`,
  )
  return data
}

export const createJourney = async (trip: Trip) => {
  const { data } = await apiClient.post<CreateJourneyResponse>(
    `/api/v1/journeys/create`,
    toJourneyPayload(trip),
  )
  return data
}

export const updateJourney = async (slug: string, trip: Trip) => {
  const { data } = await apiClient.put<Response>(
    `/api/v1/journeys/${encodeURIComponent(slug)}/update`,
    toJourneyPayload(trip),
  )
  return data
}

export const deleteJourney = async (slug: string) => {
  const { data } = await apiClient.delete<Response>(`/api/v1/journeys/${encodeURIComponent(slug)}`)
  return data
}

export const getMyJourneys = async () => {
  const { data } = await apiClient.get<GetMyJourneysResponse>('/api/v1/me/journeys')
  return data.data ?? []
}

export const leaveJourney = async (slug: string) => {
  const { data } = await apiClient.post<Response>(
    `/api/v1/journeys/${encodeURIComponent(slug)}/leave`,
  )
  return data
}
