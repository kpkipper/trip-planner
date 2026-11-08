import { safeHttpsUrl } from './safe-url'

import type { TripSettings } from '@/types/trip'

export const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can see it' },
  {
    value: 'followers',
    label: 'Followers',
    description: 'Your followers and trip members (default)',
  },
  { value: 'link', label: 'Link only', description: 'Anyone with the link; not listed' },
  { value: 'private', label: 'Private', description: 'Trip members only' },
] as const

export interface SettingsAccess {
  visibility: boolean
  hideLiveStatus: boolean
  editorsCanInvite: boolean
  cover: boolean
  draft: boolean
  timezone: boolean
}

// Which settings each role sees. The API is the real gate (owner-only fields return 403).
// `hasSettings`: the server sent the member-only settings; without them the controls whose
// current value is unknown are hidden.
export const settingsAccess = (role: string | undefined, hasSettings: boolean): SettingsAccess => {
  const owner = role === 'owner'
  const editor = role === 'editor'
  return {
    visibility: owner,
    hideLiveStatus: owner && hasSettings,
    editorsCanInvite: owner && hasSettings,
    cover: owner,
    draft: (owner || editor) && hasSettings,
    timezone: (owner || editor) && hasSettings,
  }
}

const MAX_URL_BYTES = 2048

export const coverError = (url: string): string | null => {
  const v = url.trim()
  if (!v) return null
  if (new TextEncoder().encode(v).length > MAX_URL_BYTES || !safeHttpsUrl(v)) {
    return 'Cover image must be an https URL'
  }
  return null
}

export interface SettingsForm {
  visibility: string
  coverUrl: string
  timezone: string
  hideLiveStatus: boolean
  editorsCanInvite: boolean
  draft: boolean
}

export interface SettingsOriginal {
  visibility?: string
  coverUrl?: string
  settings?: TripSettings
}

export const formFromTrip = (o: SettingsOriginal): SettingsForm => ({
  visibility: o.visibility ?? '',
  coverUrl: o.coverUrl ?? '',
  timezone: o.settings?.timezone ?? '',
  hideLiveStatus: o.settings?.hideLiveStatus ?? false,
  editorsCanInvite: o.settings?.editorsCanInvite ?? false,
  draft: o.settings?.isDraft ?? false,
})

export interface SettingsPatch {
  visibility?: string
  cover_url?: string
  timezone?: string
  hide_live_status?: boolean
  editors_can_invite?: boolean
  is_draft?: boolean
}

// Only changed fields, and only the ones this role may send.
export const buildSettingsPatch = (
  role: string | undefined,
  form: SettingsForm,
  original: SettingsOriginal,
): SettingsPatch => {
  const access = settingsAccess(role, !!original.settings)
  const s = original.settings
  const patch: SettingsPatch = {}
  if (access.visibility && form.visibility && form.visibility !== original.visibility) {
    patch.visibility = form.visibility
  }
  if (access.cover && form.coverUrl.trim() !== (original.coverUrl ?? '')) {
    patch.cover_url = form.coverUrl.trim()
  }
  if (access.timezone && form.timezone && form.timezone !== s?.timezone) {
    patch.timezone = form.timezone
  }
  if (access.hideLiveStatus && form.hideLiveStatus !== s?.hideLiveStatus) {
    patch.hide_live_status = form.hideLiveStatus
  }
  if (access.editorsCanInvite && form.editorsCanInvite !== s?.editorsCanInvite) {
    patch.editors_can_invite = form.editorsCanInvite
  }
  if (access.draft && form.draft !== s?.isDraft) patch.is_draft = form.draft
  return patch
}
