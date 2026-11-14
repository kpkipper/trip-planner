'use client'

import { useState } from 'react'

import { ChevronDown, Settings } from 'lucide-react'

import { patchJourney } from '@/api/itinerary'
import { useToast } from '@/contexts/toast-context'
import { errorSummary } from '@/lib/error-summary'
import { memberErrorMessage } from '@/lib/member-errors'
import { timezoneOptions } from '@/lib/timezone'
import {
  buildSettingsPatch,
  formFromTrip,
  settingsAccess,
  type SettingsForm,
  VISIBILITY_OPTIONS,
} from '@/lib/trip-settings'
import { buttonClass, cn, fieldClass, labelClass, switchClass } from '@/lib/ui-classes'

import CoverPicker from './cover-picker'

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

const inputClass = cn(fieldClass, 'w-full')

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
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-normal text-ink">{label}</span>
        <span className="block text-xs leading-normal text-muted">{hint}</span>
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={cn(switchClass, 'mt-0.5')}
      />
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
  const original = { visibility, settings }
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

  const save = async () => {
    if (saving) return
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
    <section className="mt-8 rounded-card bg-surface p-3 shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-tile px-3 py-2.5 text-left text-base font-semibold leading-normal tracking-tight text-ink transition-colors hover:bg-chip focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Settings size={16} />
        Settings
        <ChevronDown
          size={16}
          aria-hidden
          className={cn('ml-auto text-muted transition-transform', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div className="space-y-5 px-3 pt-3 pb-3">
          {access.cover && <CoverPicker slug={slug} coverUrl={coverUrl} onChanged={onChanged} />}
          {access.visibility && (
            <fieldset>
              <legend className={cn(labelClass, 'mb-2')}>Who can see this trip</legend>
              <div className="space-y-2">
                {VISIBILITY_OPTIONS.map((o) => (
                  <label
                    key={o.value}
                    className="flex cursor-pointer items-start gap-3 rounded-tile px-4 py-3 ring-1 ring-inset ring-line transition-colors hover:bg-chip has-[:checked]:bg-chip has-[:checked]:ring-2 has-[:checked]:ring-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
                  >
                    <input
                      type="radio"
                      name="visibility"
                      value={o.value}
                      checked={form.visibility === o.value}
                      onChange={() => set('visibility', o.value)}
                      className="mt-1 h-4 w-4 shrink-0 accent-primary focus:outline-none"
                    />
                    <span>
                      <span className="block text-sm font-medium leading-normal text-ink">
                        {o.label}
                      </span>
                      <span className="block text-xs leading-normal text-muted">
                        {o.description}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {/* Switches as one hairline-divided group. */}
          <div className="divide-y divide-line empty:hidden">
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
          </div>

          {access.timezone && (
            <label className="block">
              <span className={cn(labelClass, 'block')}>Timezone</span>
              <span className="mb-1.5 block text-xs leading-normal text-muted">
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

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className={buttonClass('primary', 'md')}
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      )}
    </section>
  )
}
