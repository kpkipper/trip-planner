import { Autocomplete } from './helper'
import { COUNTRY_NAMES } from './helper'

interface TripInfoFormProps {
  title: string
  country: string
  destination: string
  startDate: string
  endDate: string
  errors: Record<string, string>
  destinationOptions: string[]
  onTitleChange: (v: string) => void
  onCountryChange: (v: string) => void
  onDestinationChange: (v: string) => void
  onStartDateChange: (v: string) => void
  onEndDateChange: (v: string) => void
}

export default function TripInfoForm({
  title,
  country,
  destination,
  startDate,
  endDate,
  errors,
  destinationOptions,
  onTitleChange,
  onCountryChange,
  onDestinationChange,
  onStartDateChange,
  onEndDateChange,
}: TripInfoFormProps) {
  return (
    <div className="bg-white dark:bg-[#2c2c36] rounded-2xl shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.45)] border border-gray-200 dark:border-[#3c3c4a] p-6 mb-4">
      <h2 className="text-base font-semibold text-[#0163a4] dark:text-[#5fb3f5] mb-4">
        Trip Info
      </h2>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Trip Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g. Tokyo Adventure 2025"
            className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition bg-white dark:bg-[#363640] dark:text-gray-100 dark:placeholder-gray-500 ${
              errors.title
                ? 'border-red-400'
                : 'border-gray-300 dark:border-[#3c3c4a]'
            }`}
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country
            </label>
            <Autocomplete
              value={country}
              onChange={onCountryChange}
              options={COUNTRY_NAMES}
              placeholder="e.g. Japan"
              hasError={!!errors.country}
            />
            {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Destination
              {!country && (
                <span className="text-gray-400 dark:text-gray-500 font-normal">
                  {' '}
                  (select country first)
                </span>
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
              <p className="text-red-500 text-xs mt-1">{errors.destination}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition bg-white dark:bg-[#363640] dark:text-gray-100 ${
                errors.startDate
                  ? 'border-red-400'
                  : 'border-gray-300 dark:border-[#3c3c4a]'
              }`}
            />
            {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              min={startDate}
              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition bg-white dark:bg-[#363640] dark:text-gray-100 ${
                errors.endDate
                  ? 'border-red-400'
                  : 'border-gray-300 dark:border-[#3c3c4a]'
              }`}
            />
            {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
