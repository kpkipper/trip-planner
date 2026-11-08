import { safeHttpsUrl } from './safe-url'

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
export const settingsAccess = (role: string | undefined): SettingsAccess => {
  const owner = role === 'owner'
  const editor = role === 'editor'
  return {
    visibility: owner,
    hideLiveStatus: owner,
    editorsCanInvite: owner,
    cover: owner,
    draft: owner || editor,
    timezone: owner || editor,
  }
}

const MAX_URL = 2048

export const coverError = (url: string): string | null => {
  const v = url.trim()
  if (!v) return null
  if (v.length > MAX_URL || !safeHttpsUrl(v)) return 'Cover image must be an https URL'
  return null
}

// The trip view does not return these flags, so the form can only "keep" or set them.
export type Tri = 'keep' | 'on' | 'off'

export interface SettingsForm {
  visibility: string
  coverUrl: string
  timezone: string // '' = keep
  hideLiveStatus: Tri
  editorsCanInvite: Tri
  draft: Tri
}

export interface SettingsPatch {
  visibility?: string
  cover_url?: string
  timezone?: string
  hide_live_status?: boolean
  editors_can_invite?: boolean
  is_draft?: boolean
}

const flag = (v: Tri): boolean | undefined => (v === 'keep' ? undefined : v === 'on')

// Only changed fields, and only the ones this role may send.
export const buildSettingsPatch = (
  role: string | undefined,
  form: SettingsForm,
  original: { visibility?: string; coverUrl?: string },
): SettingsPatch => {
  const access = settingsAccess(role)
  const patch: SettingsPatch = {}
  if (access.visibility && form.visibility && form.visibility !== original.visibility) {
    patch.visibility = form.visibility
  }
  if (access.cover && form.coverUrl.trim() !== (original.coverUrl ?? '')) {
    patch.cover_url = form.coverUrl.trim()
  }
  if (access.timezone && form.timezone) patch.timezone = form.timezone
  const hide = flag(form.hideLiveStatus)
  if (access.hideLiveStatus && hide !== undefined) patch.hide_live_status = hide
  const invite = flag(form.editorsCanInvite)
  if (access.editorsCanInvite && invite !== undefined) patch.editors_can_invite = invite
  const draft = flag(form.draft)
  if (access.draft && draft !== undefined) patch.is_draft = draft
  return patch
}
