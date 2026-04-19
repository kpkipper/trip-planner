'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Box from '@mui/material/Box'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import { Edit2, Trash2, MapPin } from 'lucide-react'
import { useTrips } from '@/contexts/trips-context'
import { toSlug } from '@/lib/slug'
import ConfirmDialog from '@/components/confirm-dialog'
import PageLoading from '@/components/page-loading'

export default function PlanViewContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')
  const { getTrip, deleteTrip } = useTrips()
  const trip = id ? getTrip(id) : undefined
  const [selectedDayIndex, setSelectedDayIndex] = useState(() => {
    if (!trip) return 0
    const todayISO = new Date().toISOString().split('T')[0]
    const idx = trip.days.findIndex((d) => d.dateISO === todayISO)
    return idx !== -1 ? idx : 0
  })
  const [currentTime, setCurrentTime] = useState(new Date())
  const [snackbar, setSnackbar] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  const isCurrentActivity = (dayIdx: number, actIdx: number) => {
    if (!trip) return false
    const day = trip.days[dayIdx]
    const act = day.activities[actIdx]
    if (!act.time) return false
    const dateISO = day.dateISO
    const actStart = new Date(`${dateISO}T${act.time}:00`)
    const nextAct = day.activities[actIdx + 1]
    const nextStart = nextAct?.time ? new Date(`${dateISO}T${nextAct.time}:00`) : null
    if (nextStart) return currentTime >= actStart && currentTime < nextStart
    return currentTime >= actStart && currentTime < new Date(actStart.getTime() + 60 * 60 * 1000)
  }

  const handleDelete = async () => {
    if (!id) return
    setConfirmOpen(false)
    setDeleting(true)
    const code = await deleteTrip(id)
    if (code === 'JOURNEY-200000') {
      setSnackbar(true)
      setTimeout(() => {
        window.location.href = '/'
      }, 1500)
    } else {
      window.location.href = '/'
    }
  }

  if (deleting) return <PageLoading />

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>No trip selected.</p>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <p>Trip not found.</p>
        <button
          onClick={() => {
            window.location.href = '/'
          }}
          className="mt-3 text-[#0163a4] hover:underline text-sm"
        >
          Go back home
        </button>
      </div>
    )
  }

  return (
    <div className="relative max-w-3xl mx-auto px-4 py-8">
      <ConfirmDialog
        open={confirmOpen}
        title="Delete this trip?"
        description="This action cannot be undone. The trip and all its data will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      <Snackbar
        open={snackbar}
        autoHideDuration={1500}
        onClose={() => setSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity="success" onClose={() => setSnackbar(false)}>
          Trip deleted successfully!
        </Alert>
      </Snackbar>
      {/* Header */}
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
            onClick={() =>
              (window.location.href = `/${toSlug(trip.country)}/${toSlug(trip.destination)}/edit`)
            }
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm transition-colors"
          >
            <Edit2 size={14} />
            Edit
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
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
            onClick={() =>
              (window.location.href = `/${toSlug(trip.country)}/${toSlug(trip.destination)}/edit`)
            }
            className="mt-3 text-[#0163a4] hover:underline text-sm"
          >
            Edit plan to add days
          </button>
        </div>
      ) : (
        <>
          {/* Day tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={selectedDayIndex}
              onChange={(_: React.SyntheticEvent, v: number) => setSelectedDayIndex(v)}
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

          {/* Day content */}
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
                          <span className="text-xl">{act.emoji}</span>
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
