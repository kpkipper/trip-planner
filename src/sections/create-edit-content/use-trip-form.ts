import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import { State } from 'country-state-city'

import { createJourney, getJourneyBySlug } from '@/api/journey'
import { useToast } from '@/contexts/toast-context'
import { errorSummary } from '@/lib/error-summary'
import { classifyLoadError } from '@/lib/load-error'
import { guessTimezone } from '@/lib/timezone'
import { toTrip } from '@/utils/format-data'

import { ALL_COUNTRIES, generateDays, uid } from './helper'
import {
  activityErrorKey,
  checkPreconditions,
  describeOp,
  dropEmptyNewActivities,
  planSync,
  runSync,
  validateActivities,
} from './sync'

import type { Activity, Trip, TripDay } from '@/types/trip'
import type { DragEvent } from 'react'

export function useTripForm(slugProp?: string) {
  const router = useRouter()
  const { showToast } = useToast()

  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [country, setCountry] = useState('')
  const [visibility, setVisibility] = useState('followers')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [days, setDays] = useState<TripDay[]>([])
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [dragOver, setDragOver] = useState<{ dayId: string; index: number } | null>(null)
  const [loadingEdit, setLoadingEdit] = useState(!!slugProp)
  const [saving, setSaving] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)

  const dragItem = useRef<{ dayId: string; index: number } | null>(null)
  const savingRef = useRef(false)
  // The trip as loaded at edit start. Saves diff against this (never a fresh fetch), so
  // days/plans other people add meanwhile are unknown to the diff and never deleted.
  const originalRef = useRef<Trip | null>(null)

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
    originalRef.current = structuredClone(trip)
    setTitle(trip.title)
    setDestination(trip.destination)
    setCountry(trip.country)
    setStartDate(trip.startDate)
    setEndDate(trip.endDate)
    setDays(trip.days)
    setExpandedDays(new Set(trip.days.map((d) => d.id)))
  }, [])

  const loadTrip = useCallback(
    (slug: string) =>
      getJourneyBySlug(slug)
        .then((res) => {
          if (classifyLoadError(undefined, res)) {
            showToast('Trip not found', 'error')
            setLoadFailed(true)
            return
          }
          const trip = toTrip(res.data)
          if (trip.redacted || (trip.role !== 'owner' && trip.role !== 'editor')) {
            showToast("You can't edit this trip", 'error')
            setLoadFailed(true)
            return
          }
          applyTrip(trip)
        })
        .catch((err) => {
          const kind = classifyLoadError(err)
          showToast(
            kind === 'forbidden'
              ? "You don't have access"
              : kind === 'not-found'
                ? 'Trip not found'
                : 'Something went wrong',
            'error',
          )
          setLoadFailed(true)
          console.error('Failed to load trip:', errorSummary(err))
        })
        .finally(() => setLoadingEdit(false)),
    [applyTrip, showToast],
  )

  useEffect(() => {
    if (!slugProp) return
    loadTrip(slugProp)
  }, [slugProp, loadTrip])

  // Rebuild the day list when the user changes the date range (keeps existing days). A
  // loaded day that was dropped and comes back is restored, so it keeps its server id.
  const regenerateDays = (start: string, end: string) => {
    if (!start || !end || start > end) return
    setDays((prev) => {
      const inForm = new Set(prev.flatMap((d) => d.activities.map((a) => a.id)))
      const loaded = (originalRef.current?.days ?? []).map((d) => ({
        ...d,
        activities: d.activities.filter((a) => !inForm.has(a.id)),
      }))
      return generateDays(start, end, [...prev, ...loaded])
    })
  }

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
    regenerateDays(v, endDate)
    clearError('startDate')
  }
  const onEndDateChange = (v: string) => {
    setEndDate(v)
    regenerateDays(startDate, v)
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
                { id: uid(), time: '', description: '', mapUrl: '', category: '' },
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
    if (field === 'description' || field === 'mapUrl') clearError(activityErrorKey(actId, field))
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

  const validate = (cleanDays: TripDay[]) => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Trip title is required'
    if (!destination.trim()) errs.destination = 'Destination is required'
    if (!country.trim()) errs.country = 'Country is required'
    if (!startDate) errs.startDate = 'Start date is required'
    if (!endDate) errs.endDate = 'End date is required'
    if (startDate && endDate && startDate > endDate)
      errs.endDate = 'End date must be after start date'
    const activityErrs = validateActivities(cleanDays, originalRef.current)
    if (Object.keys(activityErrs).length > 0) {
      const badDays = cleanDays.filter((d) =>
        d.activities.some(
          (a) =>
            activityErrs[activityErrorKey(a.id, 'description')] ||
            activityErrs[activityErrorKey(a.id, 'mapUrl')],
        ),
      )
      setExpandedDays((prev) => new Set([...prev, ...badDays.map((d) => d.id)]))
      showToast('Some activities need fixing before saving', 'error')
    }
    setErrors({ ...errs, ...activityErrs })
    return Object.keys(errs).length === 0 && Object.keys(activityErrs).length === 0
  }

  const serverPlanIds = () =>
    new Set(originalRef.current?.days.flatMap((d) => d.activities.map((a) => a.id)) ?? [])

  const finishSaving = () => {
    savingRef.current = false
    setSaving(false)
  }

  const apiMessage = (error: unknown) => {
    const m = (error as { response?: { data?: { message?: unknown } } } | null)?.response?.data
      ?.message
    return typeof m === 'string' && m ? `: ${m}` : ''
  }

  const reloadAction = (slug: string) => ({ label: 'Reload', onClick: () => void loadTrip(slug) })

  const saveEdits = async (slug: string, cleanDays: TripDay[]) => {
    const original = originalRef.current
    if (!original) return finishSaving()
    const edited: Trip = {
      ...original,
      title,
      destination,
      country,
      startDate,
      endDate,
      days: cleanDays,
    }
    const ops = planSync(original, edited)
    if (ops.length === 0) {
      showToast('No changes to save')
      router.push(`/plans/${slug}`)
      return
    }

    // Preflight: nothing is written unless the server still matches what our ops assume.
    // On any doubt keep the user's form as-is and let them choose to reload.
    let fresh: Trip
    try {
      const res = await getJourneyBySlug(slug)
      if (classifyLoadError(undefined, res)) throw new Error('Trip not found')
      fresh = toTrip(res.data)
    } catch (err) {
      console.error('Trip preflight failed:', errorSummary(err))
      showToast("Couldn't check the latest version of this trip. Nothing was saved.", 'error')
      return finishSaving()
    }
    if (fresh.redacted || (fresh.role !== 'owner' && fresh.role !== 'editor')) {
      showToast("You can't edit this trip anymore. Nothing was saved.", 'error')
      return finishSaving()
    }
    const problems = checkPreconditions(original, fresh, ops)
    if (problems.length > 0) {
      console.warn('Trip changed elsewhere:', problems.join(', '))
      showToast('This trip was changed by someone else — reload to see their changes', 'error', {
        action: reloadAction(slug),
      })
      return finishSaving()
    }

    const result = await runSync(slug, ops)
    if (!result.ok) {
      const step = describeOp(result.op)
      console.error('Trip sync failed:', result.op.type, errorSummary(result.error))
      const status = (result.error as { response?: { status?: number } } | null)?.response?.status
      const rejected = status !== undefined && status >= 400 && status < 500
      if (result.message) {
        // The user can fix this (remove the photos first); show what the server has now.
        showToast(
          result.index > 0 ? `${result.message} (การแก้ไขอื่นบันทึกแล้ว)` : result.message,
          'error',
        )
        await loadTrip(slug)
        return finishSaving()
      }
      if (result.index === 0 && !rejected) {
        // No answer or a 5xx: the write may have landed, so show what the server has now.
        showToast(
          `Couldn't confirm that ${step} worked${apiMessage(result.error)}. Showing the latest version.`,
          'error',
        )
        await loadTrip(slug)
        return finishSaving()
      }
      if (result.index === 0) {
        // The server rejected the first write: nothing was written: the snapshot is still valid, so keep the form.
        showToast(
          `Couldn't save: ${step} failed${apiMessage(result.error)}. Nothing was changed.`,
          'error',
          {
            action: reloadAction(slug),
          },
        )
        return finishSaving()
      }
      showToast(
        `Some changes were saved, but ${step} failed${apiMessage(result.error)}. Showing the latest version.`,
        'error',
      )
      await loadTrip(slug)
      return finishSaving()
    }
    showToast('Trip updated successfully!')
    router.push(`/plans/${slug}`)
  }

  const handleSave = async () => {
    if (savingRef.current) return
    const cleanDays = dropEmptyNewActivities(days, serverPlanIds())
    if (!validate(cleanDays)) return
    savingRef.current = true
    setSaving(true)
    try {
      if (slugProp) {
        await saveEdits(slugProp, cleanDays)
      } else {
        const trip: Trip = {
          title,
          destination,
          country,
          startDate,
          endDate,
          days: cleanDays,
          visibility,
          timezone: guessTimezone(country),
        }
        const { data } = await createJourney(trip)
        showToast('Trip created successfully!')
        router.push(`/plans/${data.slug}`)
      }
    } catch (err) {
      showToast('Something went wrong while saving', 'error')
      console.error('Failed to save trip:', errorSummary(err))
      finishSaving()
    }
  }

  const handleCancel = () => router.push(slugProp ? `/plans/${slugProp}` : '/')

  return {
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
  }
}
