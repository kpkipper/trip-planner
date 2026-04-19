'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Save,
  GripVertical,
  ArrowUp,
  ArrowDown,
  MapPin,
} from 'lucide-react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { createJourney, updateJourney, getJourneyBySlug } from '@/api/journey'
import { formatJourneyDetail } from '@/utils/format-data'
import PageLoading from '@/components/page-loading'
import { State } from 'country-state-city'
import type { Activity, Trip, TripDay } from '@/types/trip'
import {
  uid,
  generateDays,
  Autocomplete,
  TimeAutocomplete,
  EmojiButton,
  ALL_COUNTRIES,
  COUNTRY_NAMES,
} from './helper'

export default function CreateEditContent({ slug: slugProp }: { slug?: string } = {}) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [country, setCountry] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [days, setDays] = useState<TripDay[]>([])
  const [snackbar, setSnackbar] = useState(false)
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragOver, setDragOver] = useState<{ dayId: string; index: number } | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(!!slugProp)

  const dragItem = useRef<{ dayId: string; index: number } | null>(null)

  const destinationOptions = useMemo(() => {
    const isoCode = ALL_COUNTRIES.find(
      (c: { name: string; isoCode: string }) => c.name === country,
    )?.isoCode
    if (!isoCode) return []
    return (State.getStatesOfCountry(isoCode) ?? [])
      .map((s) =>
        s.name
          .replace(/ Prefecture$/, '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, ''),
      )
      .sort()
  }, [country])

  useEffect(() => {
    if (!slugProp) return
    getJourneyBySlug(slugProp)
      .then(({ data }) => {
        const trip = formatJourneyDetail(data)
        setTitle(trip.title)
        setDestination(trip.destination)
        setCountry(trip.country)
        setStartDate(trip.startDate)
        setEndDate(trip.endDate)
        setDays(trip.days)
        setExpandedDays(new Set(trip.days.map((d) => d.id)))
      })
      .finally(() => setLoadingEdit(false))
  }, [slugProp])

  useEffect(() => {
    if (!startDate || !endDate || startDate > endDate) return
    setDays((prev) => generateDays(startDate, endDate, prev))
  }, [startDate, endDate])

  const toggleDay = (id: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const updateDayTitle = (dayId: string, title: string) => {
    setDays((prev) => prev.map((d) => (d.id === dayId ? { ...d, title } : d)))
  }

  const addActivity = (dayId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              activities: [
                ...d.activities,
                { id: uid(), time: '', description: '', mapUrl: '', emoji: '' },
              ],
            }
          : d,
      ),
    )
  }

  const updateActivity = (dayId: string, actId: string, field: keyof Activity, value: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? {
              ...d,
              activities: d.activities.map((a) => (a.id === actId ? { ...a, [field]: value } : a)),
            }
          : d,
      ),
    )
  }

  const removeActivity = (dayId: string, actId: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId ? { ...d, activities: d.activities.filter((a) => a.id !== actId) } : d,
      ),
    )
  }

  const moveActivity = (dayId: string, fromIndex: number, dir: 'up' | 'down') => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d
        const acts = [...d.activities]
        const to = dir === 'up' ? fromIndex - 1 : fromIndex + 1
        if (to < 0 || to >= acts.length) return d
        ;[acts[fromIndex], acts[to]] = [acts[to], acts[fromIndex]]
        return { ...d, activities: acts }
      }),
    )
  }

  const handleDragStart = (dayId: string, index: number) => {
    dragItem.current = { dayId, index }
  }

  const handleDragOver = (e: React.DragEvent, dayId: string, index: number) => {
    e.preventDefault()
    setDragOver({ dayId, index })
  }

  const handleDrop = (dayId: string, toIndex: number) => {
    if (!dragItem.current || dragItem.current.dayId !== dayId) return
    const fromIndex = dragItem.current.index
    if (fromIndex === toIndex) return
    setDays((prev) =>
      prev.map((d) => {
        if (d.id !== dayId) return d
        const acts = [...d.activities]
        const [moved] = acts.splice(fromIndex, 1)
        acts.splice(toIndex, 0, moved)
        return { ...d, activities: acts }
      }),
    )
    dragItem.current = null
    setDragOver(null)
  }

  const handleDragEnd = () => {
    dragItem.current = null
    setDragOver(null)
  }

  const clearError = (key: string) => {
    if (errors[key])
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
  }

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Trip title is required'
    if (!destination.trim()) errs.destination = 'Destination is required'
    if (!country.trim()) errs.country = 'Country is required'
    if (!startDate) errs.startDate = 'Start date is required'
    if (!endDate) errs.endDate = 'End date is required'
    if (startDate && endDate && startDate > endDate)
      errs.endDate = 'End date must be after start date'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    if (slugProp) {
      const { code } = await updateJourney(slugProp, {
        id: '',
        slug: '',
        title,
        destination,
        country,
        startDate,
        endDate,
        days,
      })
      if (code === 'JOURNEY-200000') {
        setSnackbar(true)
        setTimeout(() => {
          router.push(slugProp ? `/plans/${slugProp}` : '/')
        }, 1500)
      } else {
        router.push(slugProp ? `/plans/${slugProp}` : '/')
      }
    } else {
      const id = uid()
      const trip: Trip = {
        id,
        slug: '',
        title,
        destination,
        country,
        startDate,
        endDate,
        days,
      }
      const { code } = await createJourney(trip)
      if (code === 'JOURNEY-201000') {
        setSnackbar(true)
        setTimeout(() => {
          router.push(slugProp ? `/plans/${slugProp}` : '/')
        }, 1500)
      } else {
        router.push(slugProp ? `/plans/${slugProp}` : '/')
      }
    }
  }

  if (loadingEdit) {
    return <PageLoading />
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {slugProp ? 'Edit Plan' : 'Create New Plan'}
        </h1>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-4">
        <h2 className="text-base font-semibold text-[#0163a4] mb-4">Trip Info</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trip Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                clearError('title')
              }}
              placeholder="e.g. Tokyo Adventure 2025"
              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition ${
                errors.title ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <Autocomplete
                value={country}
                onChange={(v) => {
                  setCountry(v)
                  setDestination('')
                  clearError('country')
                }}
                options={COUNTRY_NAMES}
                placeholder="e.g. Japan"
                hasError={!!errors.country}
              />
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Destination
                {!country && (
                  <span className="text-gray-400 font-normal"> (select country first)</span>
                )}
              </label>
              <Autocomplete
                value={destination}
                onChange={(v) => {
                  setDestination(v)
                  clearError('destination')
                }}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  clearError('startDate')
                }}
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition ${
                  errors.startDate ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.startDate && <p className="text-red-500 text-xs mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  clearError('endDate')
                }}
                min={startDate}
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition ${
                  errors.endDate ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.endDate && <p className="text-red-500 text-xs mt-1">{errors.endDate}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Days */}
      {days.length > 0 && (
        <div className="space-y-3 mb-6">
          <h2 className="text-base font-semibold text-gray-700">
            Daily Plan ({days.length} {days.length === 1 ? 'day' : 'days'})
          </h2>

          {days.map((day, idx) => {
            const isExpanded = expandedDays.has(day.id)
            return (
              <div
                key={day.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <div
                  className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleDay(day.id)}
                >
                  <span className="text-xs font-semibold text-[#0163a4] bg-[#edf3f7] rounded-md px-2 py-0.5 flex-shrink-0">
                    Day {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={day.title}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateDayTitle(day.id, e.target.value)}
                    className="flex-1 text-sm font-medium text-gray-800 bg-transparent outline-none border-b border-transparent focus:border-gray-300 transition-colors"
                    placeholder="Day title..."
                  />
                  <span className="text-xs text-gray-400 flex-shrink-0">{day.date}</span>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                  )}
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    {day.activities.length === 0 && (
                      <p className="text-sm text-gray-400 text-center py-2 mb-3">
                        No activities yet. Add one below.
                      </p>
                    )}

                    <div className="space-y-2">
                      {day.activities.map((act, aIdx) => {
                        const isOver = dragOver?.dayId === day.id && dragOver?.index === aIdx
                        return (
                          <div
                            key={act.id}
                            draggable
                            onDragStart={() => handleDragStart(day.id, aIdx)}
                            onDragOver={(e) => handleDragOver(e, day.id, aIdx)}
                            onDrop={() => handleDrop(day.id, aIdx)}
                            onDragEnd={handleDragEnd}
                            className={`rounded-xl border border-gray-200 bg-gray-50 p-2.5 space-y-2 transition-colors ${
                              isOver ? 'ring-1 ring-indigo-200 bg-indigo-50' : ''
                            }`}
                          >
                            {/* Row 1: grip (desktop) | emoji | time | spacer | ↑↓ (mobile) | delete */}
                            <div className="flex items-center gap-2">
                              <span className="hidden sm:inline-flex cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none flex-shrink-0">
                                <GripVertical size={16} />
                              </span>
                              <EmojiButton
                                value={act.emoji ?? ''}
                                onChange={(v) => updateActivity(day.id, act.id, 'emoji', v)}
                              />
                              <TimeAutocomplete
                                value={act.time}
                                onChange={(v) => updateActivity(day.id, act.id, 'time', v)}
                              />
                              <div className="flex-1" />
                              <button
                                onClick={() => moveActivity(day.id, aIdx, 'up')}
                                disabled={aIdx === 0}
                                className="sm:hidden p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                onClick={() => moveActivity(day.id, aIdx, 'down')}
                                disabled={aIdx === day.activities.length - 1}
                                className="sm:hidden p-1 rounded-md hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
                              >
                                <ArrowDown size={14} />
                              </button>
                              <button
                                onClick={() => removeActivity(day.id, act.id)}
                                className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                            {/* Row 2: description */}
                            <input
                              type="text"
                              value={act.description}
                              onChange={(e) =>
                                updateActivity(day.id, act.id, 'description', e.target.value)
                              }
                              placeholder="What are you doing?"
                              className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition"
                            />
                            {/* Row 3: map URL */}
                            <div className="flex items-center gap-1.5">
                              <MapPin size={13} className="text-gray-400 flex-shrink-0" />
                              <input
                                type="text"
                                value={act.mapUrl ?? ''}
                                onChange={(e) =>
                                  updateActivity(day.id, act.id, 'mapUrl', e.target.value)
                                }
                                placeholder="Maps URL (optional)"
                                className="flex-1 border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition"
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <button
                      onClick={() => addActivity(day.id)}
                      className="flex items-center gap-1.5 text-sm text-[#0163a4] hover:text-[#0470b9] font-medium mt-3 transition-colors"
                    >
                      <Plus size={15} />
                      Add Activity
                    </button>
                  </div>
                )}
              </div>
            )
          })}
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
          onClick={() => {
            if (slugProp) {
              router.push(`/plans/${slugProp}`)
            } else {
              router.push('/')
            }
          }}
          className="px-6 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-[#0163a4] text-white rounded-lg hover:bg-[#0470b9] transition-colors text-sm font-medium"
        >
          <Save size={16} />
          Save Plan
        </button>
      </div>

      <Snackbar
        open={snackbar}
        autoHideDuration={1500}
        onClose={() => setSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSnackbar(false)}>
          {slugProp ? 'Trip updated successfully!' : 'Trip created successfully!'}
        </Alert>
      </Snackbar>
    </div>
  )
}
