import { apiClient } from '@/api/httpClient/apiClient'

import type { UploadTarget } from '@/api/moments/type'

interface Envelope<T> {
  code: string
  message: string
  data: T
}

export interface CoverUploadStart {
  upload_id: string
  upload: UploadTarget
}

const base = (slug: string) => `/api/v1/journeys/${encodeURIComponent(slug)}/cover`

export const startCoverUpload = async (
  slug: string,
  input: { content_type: string; size_bytes: number },
) => {
  const { data } = await apiClient.post<Envelope<CoverUploadStart>>(`${base(slug)}/uploads`, input)
  return data.data
}

export const completeCoverUpload = async (slug: string, uploadId: string) => {
  const { data } = await apiClient.post<Envelope<{ cover_url: string }>>(`${base(slug)}/complete`, {
    upload_id: uploadId,
  })
  return data.data
}

export const removeCover = async (slug: string) => {
  await apiClient.delete(base(slug))
}
