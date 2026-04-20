import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import { State } from 'country-state-city'

import { createJourney, getJourneyBySlug, updateJourney } from '@/api/journey'
import { useToast } from '@/contexts/toast-context'
import { toTrip } from '@/utils/format-data'

import { ALL_COUNTRIES, generateDays, uid } from './helper'

import type { Activity, Trip, TripDay } from '@/types/trip'
import type { DragEvent } from 'react'

export function useTripForm(slugProp?: string) {
  const router = useRouter()
  const { showToast } = useToast()

  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [country, setCountry] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [days, setDays] = useState<TripDay[]>([])
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragOver, setDragOver] = useState<{ dayId: string; index: number } | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(!!slugProp)
  const [saving, setSaving] = useState(false)

  const dragItem = useRef<{ dayId: string; index: number } | null>(null)
  const skipDayGen = useRef(false)
  const savingRef = useRef(false)

  const destinationOptions = useMemo(() => {
    const isoCode = ALL_COUNTRIES.find((c) => c.name === country)?.isoCode
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

  const applyTrip = useCallback((trip: Trip) => {
    skipDayGen.current = true
    setTitle(trip.title)
    setDestination(trip.destination)
    setCountry(trip.country)
    setStartDate(trip.startDate)
    setEndDate(trip.endDate)
    setDays(trip.days)
    setExpandedDays(new Set(trip.days.map((d) => d.id)))
  }, [])

  const loadTrip = useCallback(
    async (slug: string) => {
      try {
        const res = await getJourneyBySlug(slug)
        if (res.code === 'JOURNEY-404000') {
          showToast('Trip not found', 'error')
          router.replace('/plans/create')
          return
        }
        applyTrip(toTrip(res.data))
      } finally {
        setLoadingEdit(false)
      }
    },
    [applyTrip, showToast, router],
  )

  useEffect(() => {
    if (!slugProp) return
    loadTrip(slugProp)
  }, [slugProp, loadTrip])

  useEffect(() => {
    if (skipDayGen.current) {
      skipDayGen.current = false
      return
    }
    if (!startDate || !endDate || startDate > endDate) return
    setDays((prev) => generateDays(startDate, endDate, prev))
  }, [startDate, endDate])

  const clearError = (key: string) => {
    if (errors[key])
      setErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
  }

  // Field change handlers — bundle setter + clearError
  const onTitleChange = (v: string) => {
    setTitle(v)
    clearError('title')
  }
  const onCountryChange = (v: string) => {
    setCountry(v)
    setDestination('')
    clearError('country')
  }
  const onDestinationChange = (v: string) => {
    setDestination(v)
    clearError('destination')
  }
  const onStartDateChange = (v: string) => {
    setStartDate(v)
    clearError('startDate')
  }
  const onEndDateChange = (v: string) => {
    setEndDate(v)
    clearError('endDate')
  }

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

  const handleDragOver = (e: DragEvent<HTMLDivElement>, dayId: string, index: number) => {
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

  const handleSave = async () => {
    if (savingRef.current || !validate()) return
    savingRef.current = true
    setSaving(true)
    try {
      if (slugProp) {
        const { code } = await updateJourney(slugProp, {
          title,
          destination,
          country,
          startDate,
          endDate,
          days,
        })
        if (code === 'JOURNEY-404000') {
          showToast('Trip not found', 'error')
          savingRef.current = false
          setSaving(false)
          return
        }
        showToast('Trip updated successfully!')
        router.push(`/plans/${slugProp}`)
      } else {
        const trip: Trip = { id: uid(), title, destination, country, startDate, endDate, days }
        const { data } = await createJourney(trip)
        showToast('Trip created successfully!')
        router.push(`/plans/${data.slug}`)
      }
    } catch {
      savingRef.current = false
      setSaving(false)
    }
  }

  const handleCancel = () => router.push(slugProp ? `/plans/${slugProp}` : '/')

  return {
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
  }
}
