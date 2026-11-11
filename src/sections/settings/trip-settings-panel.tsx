'use client'

import { useState } from 'react'

import { Settings } from 'lucide-react'

import { patchJourney } from '@/api/itinerary'
import { useToast } from '@/contexts/toast-context'
import { errorSummary } from '@/lib/error-summary'
import { memberErrorMessage } from '@/lib/member-errors'
import { timezoneOptions } from '@/lib/timezone'
import {
  buildSettingsPatch,
  coverError,
  formFromTrip,
  settingsAccess,
  type SettingsForm,
  VISIBILITY_OPTIONS,
} from '@/lib/trip-settings'

import type { TripSettings } from '@/types/trip'

interface Props {
  slug: string
  role: string | undefined
  visibility: string | undefined
  coverUrl: string | undefined
  settings: TripSettings | undefined
  // Refetch the trip view after saving.
  onChanged: () => void
}

const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#16aef2]'

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4"
      />
      <span>
        <span className="block text-sm font-medium text-gray-700">{label}</span>
        <span className="block text-xs text-gray-500">{hint}</span>
      </span>
    </label>
  )
}

export default function TripSettingsPanel({
  slug,
  role,
  visibility,
  coverUrl,
  settings,
  onChanged,
}: Props) {
  const access = settingsAccess(role, !!settings)
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const original = { visibility, coverUrl, settings }
  const [form, setForm] = useState<SettingsForm>(() => formFromTrip(original))
  // Re-sync from the refetched trip (not on every render: unsaved edits are kept).
  const serverKey = JSON.stringify(original)
  const [syncedKey, setSyncedKey] = useState(serverKey)
  if (syncedKey !== serverKey) {
    setSyncedKey(serverKey)
    setForm(formFromTrip(original))
  }

  if (!Object.values(access).some(Boolean)) return null

  const set = <K extends keyof SettingsForm>(key: K, value: SettingsForm[K]) =>
    setForm((f) => ({ ...f, [key]: value }))
  const coverProblem = access.cover ? coverError(form.coverUrl) : null

  const save = async () => {
    if (saving || coverProblem) return
    const patch = buildSettingsPatch(role, form, original)
    if (Object.keys(patch).length === 0) {
      showToast('No changes to save')
      return
    }
    setSaving(true)
    try {
      await patchJourney(slug, patch)
      showToast('Settings saved')
      onChanged()
    } catch (err) {
      showToast(memberErrorMessage(err), 'error')
      console.error('Failed to save settings:', errorSummary(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left text-base font-semibold text-gray-800"
      >
        <Settings size={16} />
        Settings
      </button>

      {open && (
        <div className="mt-4 space-y-5">
          {access.visibility && (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-gray-700">
                Who can see this trip
              </legend>
              <div className="space-y-2">
                {VISIBILITY_OPTIONS.map((o) => (
                  <label key={o.value} className="flex cursor-pointer items-start gap-2">
                    <input
                      type="radio"
                      name="visibility"
                      value={o.value}
                      checked={form.visibility === o.value}
                      onChange={() => set('visibility', o.value)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-800">{o.label}</span>
                      <span className="block text-xs text-gray-500">{o.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {access.hideLiveStatus && (
            <Toggle
              label="Hide live status"
              hint="Followers will not see where you are while the trip is ongoing."
              checked={form.hideLiveStatus}
              onChange={(v) => set('hideLiveStatus', v)}
            />
          )}

          {access.editorsCanInvite && (
            <Toggle
              label="Editors can invite"
              hint="Let editors invite people and create invite links."
              checked={form.editorsCanInvite}
              onChange={(v) => set('editorsCanInvite', v)}
            />
          )}

          {access.membersCanPost && (
            <Toggle
              label="ให้สมาชิกอัปโหลดรูปได้"
              hint="ถ้าปิด จะมีแค่เจ้าของทริปที่อัปโหลดรูปได้"
              checked={form.membersCanPost}
              onChange={(v) => set('membersCanPost', v)}
            />
          )}

          {access.draft && (
            <Toggle
              label="Draft"
              hint="A draft trip shows as Planning, even after its dates start."
              checked={form.draft}
              onChange={(v) => set('draft', v)}
            />
          )}

          {access.timezone && (
            <label className="block">
              <span className="block text-sm font-medium text-gray-700">Timezone</span>
              <span className="mb-1 block text-xs text-gray-500">
                Used to decide which day of the trip it is.
              </span>
              <select
                value={form.timezone}
                onChange={(e) => set('timezone', e.target.value)}
                className={inputClass}
              >
                {timezoneOptions(settings?.timezone).map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </label>
          )}

          {access.cover && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Cover image URL</span>
              <input
                type="url"
                value={form.coverUrl}
                onChange={(e) => set('coverUrl', e.target.value)}
                placeholder="https://…"
                className={`${inputClass} ${coverProblem ? 'border-red-400' : ''}`}
              />
              {coverProblem && (
                <span className="mt-1 block text-xs text-red-500">{coverProblem}</span>
              )}
            </label>
          )}

          <button
            type="button"
            onClick={save}
            disabled={saving || !!coverProblem}
            className="rounded-lg bg-[#0163a4] px-4 py-2 text-sm font-medium text-white hover:bg-[#0470b9] disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      )}
    </section>
  )
}
