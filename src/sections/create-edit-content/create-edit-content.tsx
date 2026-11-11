'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { Save } from 'lucide-react'

import NotFound from '@/components/not-found'
import PageLoading from '@/components/page-loading'
import { useAuth } from '@/contexts/auth-context'
import { loginPath } from '@/lib/safe-next'
import { buttonClass } from '@/lib/ui-classes'

import DayCard from './day-card'
import TripInfoForm from './trip-info-form'
import { useTripForm } from './use-trip-form'

export default function CreateEditContent({ slug: slugProp }: { slug?: string } = {}) {
  const {
    title,
    destination,
    country,
    visibility,
    setVisibility,
    startDate,
    endDate,
    days,
    expandedDays,
    errors,
    dragOver,
    loadingEdit,
    loadFailed,
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

  // Creating needs a login: send anonymous visitors there before they fill in a form that
  // a 401 on save would throw away.
  const router = useRouter()
  const { status } = useAuth()
  const needsLogin = !slugProp && status === 'anon'
  useEffect(() => {
    if (needsLogin) router.replace(loginPath('/plans/create'))
  }, [needsLogin, router])

  if (!slugProp && status !== 'authed') return <PageLoading />
  if (loadingEdit) return <PageLoading />
  if (loadFailed) return <NotFound />

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-[28px] font-semibold leading-snug tracking-tight text-ink">
        {slugProp ? 'Edit Plan' : 'Create New Plan'}
      </h1>

      <TripInfoForm
        title={title}
        country={country}
        destination={destination}
        startDate={startDate}
        endDate={endDate}
        errors={errors}
        visibility={slugProp ? undefined : visibility}
        onVisibilityChange={setVisibility}
        destinationOptions={destinationOptions}
        onTitleChange={onTitleChange}
        onCountryChange={onCountryChange}
        onDestinationChange={onDestinationChange}
        onStartDateChange={onStartDateChange}
        onEndDateChange={onEndDateChange}
      />

      {days.length > 0 && (
        <div className="mb-6 space-y-3">
          <h2 className="text-lg font-semibold leading-normal tracking-tight text-ink">
            Daily Plan ({days.length} {days.length === 1 ? 'day' : 'days'})
          </h2>
          {days.map((day, idx) => (
            <DayCard
              key={day.id}
              day={day}
              dayIdx={idx}
              isExpanded={expandedDays.has(day.id)}
              dragOver={dragOver}
              errors={errors}
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
        <div className="mb-6 rounded-tile bg-danger/5 p-4 text-sm leading-normal text-danger">
          End date must be after start date.
        </div>
      )}

      {days.length === 0 && (!startDate || !endDate) && (
        <div className="mb-6 rounded-tile bg-accent-soft p-4 text-sm leading-normal text-ink-2">
          Set start and end dates above to generate your day-by-day plan.
        </div>
      )}

      {/* Sticky action bar. <main> is the scroll root and sticky insets count from its content
          box, so its tab-bar padding already lifts the bar above the mobile tab bar: a small
          inset is enough. No z-index, so nothing here stacks over dialogs. */}
      <div className="sticky bottom-3 flex items-center justify-end gap-2 rounded-card bg-surface p-2 shadow-soft ring-1 ring-line md:bottom-4">
        <button onClick={handleCancel} className={buttonClass('ghost', 'lg')}>
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`${buttonClass('primary', 'lg')} flex-1 sm:flex-none`}
        >
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Plan'}
        </button>
      </div>
    </div>
  )
}
