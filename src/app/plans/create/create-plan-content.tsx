'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Trash2, ChevronDown, ChevronUp, ArrowLeft, Save, GripVertical } from 'lucide-react'
import { useTrips } from '@/contexts/trips-context'
import { toSlug } from '@/lib/slug'
import type { Activity, Trip, TripDay } from '@/types/trip'

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function formatDateDisplay(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
}

function generateDays(startDate: string, endDate: string, existing: TripDay[]): TripDay[] {
  const days: TripDay[] = []
  const start = new Date(startDate + 'T12:00:00')
  const end = new Date(endDate + 'T12:00:00')
  const cur = new Date(start)
  let i = 0
  while (cur <= end && i < 60) {
    const dateISO = cur.toISOString().split('T')[0]
    const dateDisplay = formatDateDisplay(dateISO)
    const prev = existing.find((d) => d.dateISO === dateISO)
    days.push(
      prev ?? { id: uid(), date: dateDisplay, dateISO, title: dateDisplay, activities: [] },
    )
    cur.setDate(cur.getDate() + 1)
    i++
  }
  return days
}

export default function CreatePlanContent({ editId: editIdProp }: { editId?: string | null } = {}) {
  const searchParams = useSearchParams()
  const editId = editIdProp ?? searchParams.get('id')
  const { addTrip, updateTrip, getTrip } = useTrips()

  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [country, setCountry] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [days, setDays] = useState<TripDay[]>([])
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragOver, setDragOver] = useState<{ dayId: string; index: number } | null>(null)

  const dragItem = useRef<{ dayId: string; index: number } | null>(null)

  useEffect(() => {
    if (!editId) return
    const trip = getTrip(editId)
    if (!trip) return
    setTitle(trip.title)
    setDestination(trip.destination)
    setCountry(trip.country)
    setStartDate(trip.startDate)
    setEndDate(trip.endDate)
    setDays(trip.days)
    setExpandedDays(new Set(trip.days.map((d) => d.id)))
  }, [editId, getTrip])

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
          ? { ...d, activities: [...d.activities, { id: uid(), time: '', description: '', mapUrl: '' }] }
          : d,
      ),
    )
  }

  const updateActivity = (dayId: string, actId: string, field: keyof Activity, value: string) => {
    setDays((prev) =>
      prev.map((d) =>
        d.id === dayId
          ? { ...d, activities: d.activities.map((a) => (a.id === actId ? { ...a, [field]: value } : a)) }
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

  const handleSave = () => {
    if (!validate()) return
    const now = new Date().toISOString()
    if (editId) {
      updateTrip({ id: editId, title, destination, country, startDate, endDate, days, createdAt: now, updatedAt: now })
      window.location.href = `/${toSlug(country)}/${toSlug(destination)}`
    } else {
      const id = uid()
      const trip: Trip = { id, title, destination, country, startDate, endDate, days, createdAt: now, updatedAt: now }
      addTrip(trip)
      window.location.href = `/${toSlug(country)}/${toSlug(destination)}`
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {editId ? 'Edit Plan' : 'Create New Plan'}
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
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Tokyo Adventure 2025"
              className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition ${
                errors.title ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Tokyo"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition ${
                  errors.destination ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.destination && <p className="text-red-500 text-xs mt-1">{errors.destination}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="e.g. Japan"
                className={`w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition ${
                  errors.country ? 'border-red-400' : 'border-gray-300'
                }`}
              />
              {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
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
                onChange={(e) => setEndDate(e.target.value)}
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
                            className={`flex items-start gap-2 rounded-lg transition-colors ${
                              isOver ? 'bg-indigo-50 ring-1 ring-indigo-200' : ''
                            }`}
                          >
                            <span className="mt-2 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none flex-shrink-0">
                              <GripVertical size={16} />
                            </span>
                            <div className="flex-1 grid grid-cols-[80px_1fr] gap-2">
                              <input
                                type="text"
                                value={act.time}
                                onChange={(e) => updateActivity(day.id, act.id, 'time', e.target.value)}
                                placeholder="09:00"
                                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition"
                              />
                              <input
                                type="text"
                                value={act.description}
                                onChange={(e) => updateActivity(day.id, act.id, 'description', e.target.value)}
                                placeholder="What are you doing?"
                                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition"
                              />
                            </div>
                            <input
                              type="text"
                              value={act.mapUrl ?? ''}
                              onChange={(e) => updateActivity(day.id, act.id, 'mapUrl', e.target.value)}
                              placeholder="Maps URL (optional)"
                              className="flex-[0.8] border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4] transition hidden sm:block"
                            />
                            <button
                              onClick={() => removeActivity(day.id, act.id)}
                              className="mt-1.5 p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                            >
                              <Trash2 size={15} />
                            </button>
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

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#0163a4] text-white rounded-lg hover:bg-[#0470b9] transition-colors text-sm font-medium"
        >
          <Save size={16} />
          Save Plan
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
