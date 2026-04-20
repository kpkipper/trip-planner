'use client'

import { Save } from 'lucide-react'

import PageLoading from '@/components/page-loading'

import DayCard from './day-card'
import TripInfoForm from './trip-info-form'
import { useTripForm } from './use-trip-form'

export default function CreateEditContent({ slug: slugProp }: { slug?: string } = {}) {
  const {
    title,
    destination,
    country,
    startDate,
    endDate,
    days,
    expandedDays,
    errors,
    dragOver,
    loadingEdit,
    saving,
    destinationOptions,
    onTitleChange,
    onCountryChange,
    onDestinationChange,
    onStartDateChange,
    onEndDateChange,
    toggleDay,
    updateDayTitle,
    addActivity,
    updateActivity,
    removeActivity,
    moveActivity,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
    handleSave,
    handleCancel,
  } = useTripForm(slugProp)

  if (loadingEdit) return <PageLoading />

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {slugProp ? 'Edit Plan' : 'Create New Plan'}
        </h1>
      </div>

      <TripInfoForm
        title={title}
        country={country}
        destination={destination}
        startDate={startDate}
        endDate={endDate}
        errors={errors}
        destinationOptions={destinationOptions}
        onTitleChange={onTitleChange}
        onCountryChange={onCountryChange}
        onDestinationChange={onDestinationChange}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
      />

      {days.length > 0 && (
        <div className="space-y-3 mb-6">
          <h2 className="text-base font-semibold text-gray-700">
            Daily Plan ({days.length} {days.length === 1 ? 'day' : 'days'})
          </h2>
          {days.map((day, idx) => (
            <DayCard
              key={day.id}
              day={day}
              dayIdx={idx}
              isExpanded={expandedDays.has(day.id)}
              dragOver={dragOver}
              onToggle={() => toggleDay(day.id)}
              onUpdateTitle={(t) => updateDayTitle(day.id, t)}
              onAddActivity={() => addActivity(day.id)}
              onUpdateActivity={(actId, field, value) =>
                updateActivity(day.id, actId, field, value)
              }
              onRemoveActivity={(actId) => removeActivity(day.id, actId)}
              onMoveActivity={(aIdx, dir) => moveActivity(day.id, aIdx, dir)}
              onDragStart={(aIdx) => handleDragStart(day.id, aIdx)}
              onDragOver={(e, aIdx) => handleDragOver(e, day.id, aIdx)}
              onDrop={(aIdx) => handleDrop(day.id, aIdx)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      )}

      {days.length === 0 && startDate && endDate && startDate > endDate && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-800">
          End date must be after start date.
        </div>
      )}

      {days.length === 0 && (!startDate || !endDate) && (
        <div className="bg-[#edf3f7] border border-[#0163a4]/20 rounded-xl p-4 mb-6 text-sm text-[#0163a4]">
          Set start and end dates above to generate your day-by-day plan.
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={handleCancel}
          className="px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-[#0163a4] text-white rounded-lg hover:bg-[#0470b9] transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Plan'}
        </button>
      </div>
    </div>
  )
}
