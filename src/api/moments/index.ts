import { apiClient } from '@/api/httpClient/apiClient'

import type { Envelope, MomentView, StartUploadInput, StartUploadResult } from './type'

const seg = encodeURIComponent
const base = (slug: string) => `/api/v1/journeys/${seg(slug)}/moments`

export const startUpload = async (slug: string, input: StartUploadInput) => {
  const { data } = await apiClient.post<Envelope<StartUploadResult>>(`${base(slug)}/uploads`, input)
  return data.data
}

export const completeUpload = async (slug: string, id: string) => {
  const { data } = await apiClient.post<Envelope<MomentView>>(`${base(slug)}/${seg(id)}/complete`)
  return data.data
}

export const listMoments = async (slug: string) => {
  const { data } = await apiClient.get<Envelope<{ moments: MomentView[] }>>(base(slug))
  return data.data?.moments ?? []
}

export const updateCaption = async (id: string, caption: string) => {
  const { data } = await apiClient.patch<Envelope<MomentView>>(`/api/v1/moments/${seg(id)}`, {
    caption,
  })
  return data.data
}

export const deleteMoment = async (id: string) => {
  await apiClient.delete(`/api/v1/moments/${seg(id)}`)
}

export const listMyMoments = async () => {
  const { data } = await apiClient.get<Envelope<{ moments: MomentView[] }>>('/api/v1/me/moments')
  return data.data?.moments ?? []
}
