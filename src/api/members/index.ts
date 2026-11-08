import { apiClient } from '@/api/httpClient/apiClient'

import type {
  CreatedInviteLink,
  Envelope,
  InviteLink,
  InviteView,
  MemberRole,
  MemberView,
} from './type'

const base = (slug: string) => `/api/v1/journeys/${encodeURIComponent(slug)}`
const seg = encodeURIComponent

export const listMembers = async (slug: string) => {
  const { data } = await apiClient.get<Envelope<MemberView[]>>(`${base(slug)}/members`)
  return data.data ?? []
}

export const invite = async (slug: string, username: string, role: MemberRole) => {
  const { data } = await apiClient.post<Envelope<MemberView>>(`${base(slug)}/members`, {
    username,
    role,
  })
  return data.data
}

export const changeRole = async (slug: string, username: string, role: MemberRole) => {
  await apiClient.patch(`${base(slug)}/members/${seg(username)}`, { role })
}

export const removeMember = async (slug: string, username: string) => {
  await apiClient.delete(`${base(slug)}/members/${seg(username)}`)
}

export const listInviteLinks = async (slug: string) => {
  const { data } = await apiClient.get<Envelope<InviteLink[]>>(`${base(slug)}/invite-links`)
  return data.data ?? []
}

// The URL (with the token) is only returned here, never by listInviteLinks.
export const createInviteLink = async (slug: string, role: MemberRole) => {
  const { data } = await apiClient.post<Envelope<CreatedInviteLink>>(`${base(slug)}/invite-links`, {
    role,
  })
  return data.data
}

export const revokeInviteLink = async (slug: string, id: string) => {
  await apiClient.delete(`${base(slug)}/invite-links/${seg(id)}`)
}

// The token goes in the body so it stays out of access logs.
export const joinByLink = async (token: string) => {
  const { data } = await apiClient.post<Envelope<{ slug: string }>>('/api/v1/invites/join', {
    token,
  })
  return data.data.slug
}

export const myInvites = async () => {
  const { data } = await apiClient.get<Envelope<InviteView[]>>('/api/v1/me/invites')
  return data.data ?? []
}

export const acceptInvite = async (id: string) => {
  await apiClient.post(`/api/v1/me/invites/${seg(id)}/accept`)
}

export const declineInvite = async (id: string) => {
  await apiClient.post(`/api/v1/me/invites/${seg(id)}/decline`)
}
