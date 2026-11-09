import { apiClient } from '@/api/httpClient/apiClient'

import type { Envelope, ReportInput, ReportView } from './type'
import type { PublicProfileType } from '@/api/journey/type'

const seg = encodeURIComponent

export const blockUser = async (username: string) => {
  await apiClient.post(`/api/v1/users/${seg(username)}/block`)
}

export const unblockUser = async (username: string) => {
  await apiClient.delete(`/api/v1/users/${seg(username)}/block`)
}

export const listBlocks = async () => {
  const { data } =
    await apiClient.get<Envelope<{ users: PublicProfileType[] }>>('/api/v1/me/blocks')
  return data.data?.users ?? []
}

// 201 = a new report, 200 = an existing duplicate.
export const createReport = async (input: ReportInput) => {
  const res = await apiClient.post<Envelope<ReportView>>('/api/v1/reports', input)
  return { report: res.data.data, created: res.status === 201 }
}
