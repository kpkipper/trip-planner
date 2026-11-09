import type { PublicProfileType } from '@/api/journey/type'

export interface Envelope<T> {
  code?: string
  message?: string
  data: T
}

export type MomentKind = 'photo' | 'video'

export interface MomentView {
  id: string
  day_id: string
  plan_id?: string | null
  kind: MomentKind
  status: string
  caption: string
  width: number
  height: number
  duration_ms: number
  url: string
  thumb_url: string
  uploader: PublicProfileType
  created_at: string
  can_delete: boolean
  journey?: { slug: string; title: string }
}

export interface StartUploadInput {
  kind: MomentKind
  content_type: string
  size_bytes: number
  day_id: string
  plan_id?: string
  caption?: string
}

export interface UploadTarget {
  url: string
  method: string
  headers: Record<string, string>
  expires_at?: string
}

export interface StartUploadResult {
  moment: MomentView
  upload: UploadTarget
}
