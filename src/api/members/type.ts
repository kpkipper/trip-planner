export type MemberRole = 'editor' | 'traveler'

export interface MemberView {
  username: string
  display_name: string
  avatar_url: string
  role: string
  status: string
}

export interface InviteLink {
  id: string
  role: string
  expires_at: string
  created_at?: string
}

export interface CreatedInviteLink {
  url: string
  link: InviteLink
}

export interface InviteView {
  id: string
  journey_slug: string
  journey_title: string
  role: string
  invited_by: string
}

export interface Envelope<T> {
  code: string
  message: string
  data: T
}
