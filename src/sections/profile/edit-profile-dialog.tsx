'use client'

import { useState } from 'react'

import { updateMe } from '@/api/me'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { errorSummary } from '@/lib/error-summary'
import { notifyFollowRequestsChanged } from '@/lib/follow-requests'
import {
  buildProfilePatch,
  type ProfileErrors,
  type ProfileForm,
  validateProfile,
} from '@/lib/profile-form'
import { buttonClass } from '@/lib/ui-classes'

import type { User } from '@/api/me/type'

interface Props {
  user: User
  onClose: () => void
  // acceptedPending: approval was turned off, so the server accepted every pending request.
  onSaved: (user: User, info: { acceptedPending: boolean }) => void
}

const inputClass =
  'w-full rounded-lg border px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-accent'

export default function EditProfileDialog({ user, onClose, onSaved }: Props) {
  const { setUser } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState<ProfileForm>({
    username: user.username,
    displayName: user.display_name ?? '',
    bio: user.bio ?? '',
    avatarUrl: user.avatar_url ?? '',
  })
  const [errors, setErrors] = useState<ProfileErrors>({})
  const [saving, setSaving] = useState(false)
  const wasApproving = user.follow_approval !== false
  const [approve, setApprove] = useState(wasApproving)

  const set = (key: keyof ProfileForm, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (saving) return
    const found = validateProfile(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    const patch = buildProfilePatch(form, {
      username: user.username,
      display_name: user.display_name ?? '',
      bio: user.bio ?? '',
      avatar_url: user.avatar_url ?? '',
    })
    if (approve !== wasApproving) patch.follow_approval = approve
    if (Object.keys(patch).length === 0) {
      onClose()
      return
    }
    setSaving(true)
    try {
      const updated = await updateMe(patch)
      setUser(updated)
      const acceptedPending = patch.follow_approval === false
      if (acceptedPending) notifyFollowRequestsChanged()
      showToast('Profile updated')
      onSaved(updated, { acceptedPending })
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status
      if (status === 409) setErrors({ username: 'That username is taken' })
      else showToast('Could not update your profile', 'error')
      console.error('Failed to update profile:', errorSummary(err))
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof ProfileForm) =>
    `${inputClass} ${errors[key] ? 'border-red-400' : 'border-gray-200'}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={submit}
        role="dialog"
        aria-label="Edit profile"
        className="relative w-full max-w-md space-y-4 rounded-card bg-surface p-6 shadow-xl"
      >
        <h2 className="text-base font-semibold text-gray-800">Edit profile</h2>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Username</span>
          <input
            value={form.username}
            onChange={(e) => set('username', e.target.value)}
            className={field('username')}
            autoCapitalize="none"
            autoComplete="off"
          />
          {errors.username && (
            <span className="mt-1 block text-xs text-red-500">{errors.username}</span>
          )}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Display name</span>
          <input
            value={form.displayName}
            onChange={(e) => set('displayName', e.target.value)}
            className={field('displayName')}
          />
          {errors.displayName && (
            <span className="mt-1 block text-xs text-red-500">{errors.displayName}</span>
          )}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Bio</span>
          <textarea
            value={form.bio}
            onChange={(e) => set('bio', e.target.value)}
            rows={3}
            className={field('bio')}
          />
          <span className="mt-1 block text-xs text-gray-400">{[...form.bio].length}/160</span>
          {errors.bio && <span className="block text-xs text-red-500">{errors.bio}</span>}
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-gray-700">Avatar URL</span>
          <input
            type="url"
            value={form.avatarUrl}
            onChange={(e) => set('avatarUrl', e.target.value)}
            placeholder="https://…"
            className={field('avatarUrl')}
          />
          {errors.avatarUrl && (
            <span className="mt-1 block text-xs text-red-500">{errors.avatarUrl}</span>
          )}
        </label>

        <div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              role="switch"
              checked={approve}
              onChange={(e) => setApprove(e.target.checked)}
              className="mt-1 h-4 w-4"
            />
            <span>
              <span className="block text-sm font-medium text-gray-700">Approve followers</span>
              <span className="block text-xs text-gray-400">
                People must ask before following you.
              </span>
            </span>
          </label>
          {wasApproving && !approve && (
            <p role="status" className="mt-2 text-xs text-amber-600">
              Pending requests will all be accepted.
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={buttonClass('ghost')}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className={buttonClass('primary', 'md')}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
