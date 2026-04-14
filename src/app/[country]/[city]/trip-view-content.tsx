'use client'

import React, { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import { Edit2, Trash2, MapPin, Save } from 'lucide-react'
import { useTrips } from '@/contexts/trips-context'
import { toSlug } from '@/lib/slug'
import { TokyoTrip } from '@/sections/tokyo-trip'
import { OsakaTrip } from '@/sections/osaka-trip'
import type { Trip } from '@/types/trip'

function TripView({ trip, country, city }: { trip: Trip; country: string; city: string }) {
  const { deleteTrip } = useTrips()
  const [selectedDayIndex, setSelectedDayIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const isCurrentActivity = (dayIdx: number, actIdx: number) => {
    const day = trip.days[dayIdx]
    const act = day.activities[actIdx]
    if (!act.time) return false
    const actStart = new Date(`${day.dateISO}T${act.time}:00`)
    const nextAct = day.activities[actIdx + 1]
    const nextStart = nextAct?.time ? new Date(`${day.dateISO}T${nextAct.time}:00`) : null
    if (nextStart) return currentTime >= actStart && currentTime < nextStart
    return currentTime >= actStart && currentTime < new Date(actStart.getTime() + 60 * 60 * 1000)
  }

  // Downloads a merged trips.json — replace public/data/trips.json and redeploy
  const handleSaveToApp = async () => {
    setSaving(true)
    try {
      let existing: Trip[] = []
      try {
        const res = await fetch('/data/trips.json')
        existing = await res.json()
      } catch {
        // ignore if file doesn't exist yet
      }
      // Add or update the current trip (exclude builtin-tokyo which is hardcoded)
      const filtered = existing.filter((t) => t.id !== trip.id && !t.id.startsWith('builtin-'))
      const merged = [...filtered, trip]
      const json = JSON.stringify(merged, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'trips.json'
      a.click()
      URL.revokeObjectURL(url)
      alert('Downloaded trips.json\n\nReplace public/data/trips.json in the repo, then run: pnpm release')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = () => {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return
    deleteTrip(trip.id)
    window.location.href = '/'
  }

  return (
    <div className="relative max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{trip.title}</h1>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
              <MapPin size={13} />
              <span>
                {trip.destination}, {trip.country}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveToApp}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#0163a4] hover:bg-[#edf3f7] text-[#0163a4] text-sm transition-colors disabled:opacity-50"
          >
            <Save size={14} />
            {saving ? 'Saving...' : 'Save to app'}
          </button>
          <button
            onClick={() => {
              window.location.href = `/${country}/${city}/edit`
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm transition-colors"
          >
            <Edit2 size={14} />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 text-sm transition-colors"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>

      <p className="font-semibold text-[#0470b9] text-sm mb-6">
        {new Date(trip.startDate + 'T12:00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}{' '}
        &ndash;{' '}
        {new Date(trip.endDate + 'T12:00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}
      </p>

      {trip.days.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          <p>No days planned yet.</p>
          <button
            onClick={() => {
              window.location.href = `/${country}/${city}/edit`
            }}
            className="mt-3 text-[#0163a4] hover:underline text-sm"
          >
            Edit plan to add days
          </button>
        </div>
      ) : (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={selectedDayIndex}
              onChange={(_, v) => setSelectedDayIndex(v)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              {trip.days.map((day, idx) => (
                <Tab
                  key={day.id}
                  label={
                    <div className="text-center">
                      <div className="text-xs text-gray-500">Day {idx + 1}</div>
                      <div className="font-semibold">{day.date}</div>
                    </div>
                  }
                  sx={{
                    textTransform: 'none',
                    transition: 'all 0.3s ease',
                    '&.Mui-selected': { color: '#4f46e5', fontWeight: 'bold' },
                  }}
                />
              ))}
            </Tabs>
          </Box>

          {trip.days[selectedDayIndex] && (
            <div className="mb-6 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-b from-[#edf3f7] to-70% px-6 py-4">
                <h2 className="text-lg font-semibold text-[#0163a4]">
                  Day {selectedDayIndex + 1}: {trip.days[selectedDayIndex].title}
                </h2>
                <p className="text-[#0470b9] font-semibold inline-block px-4 py-1.5 rounded-md w-fit text-base shadow-sm mt-1 bg-[#0470b91a]">
                  {trip.days[selectedDayIndex].date}
                </p>
              </div>

              {trip.days[selectedDayIndex].activities.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400 text-sm bg-white">
                  No activities for this day yet.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {trip.days[selectedDayIndex].activities.map((act, idx) => {
                    const highlight = isCurrentActivity(selectedDayIndex, idx)
                    return (
                      <li
                        key={act.id}
                        className={`flex items-center justify-between px-6 py-3 cursor-pointer hover:bg-indigo-50 transition ${
                          highlight ? 'bg-yellow-100 font-medium text-indigo-800' : 'bg-white'
                        }`}
                        onClick={() => act.mapUrl && window.open(act.mapUrl, '_blank')}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-xl">📍</span>
                          <span>{`${act.time ? act.time + ': ' : ''}${act.description}`}</span>
                        </span>
                        {act.mapUrl && <MapPin size={14} className="text-gray-400 flex-shrink-0" />}
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function TripViewContent({ country, city }: { country: string; city: string }) {
  const { trips, loaded } = useTrips()

  if (country === 'japan' && city === 'tokyo') {
    return <TokyoTrip />
  }

  if (country === 'japan' && city === 'osaka') {
    return <OsakaTrip />
  }

  if (!loaded) {
    return <div className="p-8 text-gray-400 text-sm">Loading...</div>
  }

  const trip = trips.find((t) => toSlug(t.country) === country && toSlug(t.destination) === city)

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Trip not found.</p>
      </div>
    )
  }

  return <TripView trip={trip} country={country} city={city} />
}
