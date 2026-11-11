import { VISIBILITY_OPTIONS } from '@/lib/trip-settings'
import { cn, fieldClass, fieldErrorClass, labelClass } from '@/lib/ui-classes'

import { Autocomplete } from './helper'
import { COUNTRY_NAMES } from './helper'

interface TripInfoFormProps {
  title: string
  country: string
  destination: string
  startDate: string
  endDate: string
  errors: Record<string, string>
  // Only passed on create; the visibility of an existing trip is changed in its settings.
  visibility?: string
  onVisibilityChange: (v: string) => void
  destinationOptions: string[]
  onTitleChange: (v: string) => void
  onCountryChange: (v: string) => void
  onDestinationChange: (v: string) => void
  onStartDateChange: (v: string) => void
  onEndDateChange: (v: string) => void
}

const label = cn(labelClass, 'mb-1.5 block')
const errorText = 'mt-1 text-xs leading-normal text-danger'
const field = (hasError: boolean) => cn(fieldClass, 'w-full', hasError && fieldErrorClass)

export default function TripInfoForm({
  title,
  country,
  destination,
  startDate,
  endDate,
  errors,
  visibility,
  onVisibilityChange,
  destinationOptions,
  onTitleChange,
  onCountryChange,
  onDestinationChange,
  onStartDateChange,
  onEndDateChange,
}: TripInfoFormProps) {
  return (
    <div className="mb-6 rounded-card bg-surface p-6 shadow-soft">
      <h2 className="mb-5 text-lg font-semibold leading-normal tracking-tight text-ink">Trip Info</h2>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className={label}>Trip Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g. Tokyo Adventure 2025"
            className={field(!!errors.title)}
          />
          {errors.title && <p className={errorText}>{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Country</label>
            <Autocomplete
              value={country}
              onChange={onCountryChange}
              options={COUNTRY_NAMES}
              placeholder="e.g. Japan"
              hasError={!!errors.country}
            />
            {errors.country && <p className={errorText}>{errors.country}</p>}
          </div>
          <div>
            <label className={label}>
              Destination
              {!country && (
                <span className="font-normal text-muted/80"> (select country first)</span>
              )}
            </label>
            <Autocomplete
              value={destination}
              onChange={onDestinationChange}
              options={destinationOptions}
              placeholder={country ? 'e.g. Tokyo' : '—'}
              disabled={!country}
              hasError={!!errors.destination}
            />
            {errors.destination && (
              <p className={errorText}>{errors.destination}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={label}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className={field(!!errors.startDate)}
            />
            {errors.startDate && <p className={errorText}>{errors.startDate}</p>}
          </div>
          <div>
            <label className={label}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              min={startDate}
              className={field(!!errors.endDate)}
            />
            {errors.endDate && <p className={errorText}>{errors.endDate}</p>}
          </div>
        </div>

        {visibility !== undefined && (
          <div>
            <label className={label}>Visibility</label>
            <select
              value={visibility}
              onChange={(e) => onVisibilityChange(e.target.value)}
              className={field(false)}
            >
              {VISIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label} — {o.description}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
