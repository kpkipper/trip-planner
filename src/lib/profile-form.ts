import { safeHttpsUrl } from './safe-url'

import type { ProfilePatch, User } from '@/api/me/type'

export interface ProfileForm {
  username: string
  displayName: string
  bio: string
  avatarUrl: string
}

export type ProfileErrors = Partial<Record<keyof ProfileForm, string>>

const USERNAME = /^[a-z0-9_]{3,20}$/
const MAX_URL_BYTES = 2048
const chars = (s: string) => [...s].length

// Mirrors the backend rules (the server lowercases the username).
export const validateProfile = (form: ProfileForm): ProfileErrors => {
  const errors: ProfileErrors = {}
  if (!USERNAME.test(form.username.trim().toLowerCase())) {
    errors.username = 'Username must be 3-20 characters: a-z, 0-9, _'
  }
  if (chars(form.displayName) > 50)
    errors.displayName = 'Display name must be at most 50 characters'
  if (chars(form.bio) > 160) errors.bio = 'Bio must be at most 160 characters'
  const avatar = form.avatarUrl.trim()
  if (
    avatar &&
    (new TextEncoder().encode(avatar).length > MAX_URL_BYTES || !safeHttpsUrl(avatar))
  ) {
    errors.avatarUrl = 'Avatar must be an https URL'
  }
  return errors
}

export const buildProfilePatch = (
  form: ProfileForm,
  user: Pick<User, 'username' | 'display_name' | 'bio' | 'avatar_url'>,
): ProfilePatch => {
  const patch: ProfilePatch = {}
  const username = form.username.trim().toLowerCase()
  if (username !== user.username) patch.username = username
  if (form.displayName !== user.display_name) patch.display_name = form.displayName
  if (form.bio !== user.bio) patch.bio = form.bio
  if (form.avatarUrl.trim() !== user.avatar_url) patch.avatar_url = form.avatarUrl.trim()
  return patch
}
