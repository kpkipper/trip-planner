import type { Trip } from '@/types/trip'
import { apiClient } from '@/api/httpClient/apiClient'
import type { GetListJourneyResponse, GetJourneyTripResponse, Response } from './type'
import { mapTripPayload } from './mapper'

export const getJourneys = async () => {
  const { data } = await apiClient.get<GetListJourneyResponse>(`/api/v1/journeys`)
  return data
}

export const getJourneyById = async (id: string) => {
  const { data } = await apiClient.get<GetJourneyTripResponse>(`/api/v1/journeys/${id}`)
  return data
}

export const createJourney = async (trip: Trip) => {
  const { data } = await apiClient.post<Response>(`/api/v1/journeys/create`, mapTripPayload(trip))
  return data
}

export const updateJourney = async (id: string, trip: Trip) => {
  const { data } = await apiClient.put<GetJourneyTripResponse>(
    `/api/v1/journeys/${id}`,
    mapTripPayload(trip),
  )
  return data
}

export const deleteJourney = async (id: string) => {
  const { data } = await apiClient.delete<Response>(`/api/v1/journeys/${id}`)
  return data
}
