import { apiClient } from '@/api/httpClient/apiClient'

import type { DayBody, DayResponse, JourneyPatchBody, PlanBody, PlanResponse } from './type'

const base = (slug: string) => `/api/v1/journeys/${encodeURIComponent(slug)}`
const seg = encodeURIComponent

export const patchJourney = async (slug: string, body: JourneyPatchBody) => {
  await apiClient.patch(base(slug), body)
}

export const addDay = async (slug: string, body: DayBody) => {
  const { data } = await apiClient.post<DayResponse>(`${base(slug)}/days`, body)
  return data.data
}

export const updateDay = async (slug: string, dayId: string, body: DayBody) => {
  await apiClient.patch(`${base(slug)}/days/${seg(dayId)}`, body)
}

export const deleteDay = async (slug: string, dayId: string) => {
  await apiClient.delete(`${base(slug)}/days/${seg(dayId)}`)
}

export const addPlan = async (slug: string, dayId: string, body: PlanBody) => {
  const { data } = await apiClient.post<PlanResponse>(
    `${base(slug)}/days/${seg(dayId)}/plans`,
    body,
  )
  return data.data
}

export const updatePlan = async (slug: string, planId: string, body: PlanBody) => {
  await apiClient.patch(`${base(slug)}/plans/${seg(planId)}`, body)
}

export const deletePlan = async (slug: string, planId: string) => {
  await apiClient.delete(`${base(slug)}/plans/${seg(planId)}`)
}

// planIds must be exactly the day's current plans, in the wanted order.
export const reorderPlans = async (slug: string, dayId: string, planIds: string[]) => {
  await apiClient.put(`${base(slug)}/days/${seg(dayId)}/plans/order`, { plan_ids: planIds })
}
