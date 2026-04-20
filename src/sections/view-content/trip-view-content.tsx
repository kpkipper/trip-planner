'use client'

import { type SyntheticEvent } from 'react'

import { useRouter } from 'next/navigation'

import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { Edit2, MapPin, Trash2 } from 'lucide-react'

import ConfirmDialog from '@/components/confirm-dialog'
import NotFound from '@/components/not-found'
import PageLoading from '@/components/page-loading'

import ActivityItem from './activity-item'
import { useTripView } from './use-trip-view'

export default function TripViewContent({ slug }: { slug: string }) {
  const router = useRouter()
  const {
    trip,
    selectedDayIndex,
    setSelectedDayIndex,
    confirmOpen,
    setConfirmOpen,
    deleting,
    loading,
    notFound,
    isCurrentActivity,
    handleDelete,
  } = useTripView(slug)

  if (loading || deleting) return <PageLoading />
  if (notFound || !trip) return <NotFound />

  const selectedDay = trip.days[selectedDayIndex]

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

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{trip.title}</h1>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
            <MapPin size={13} />
            <span>
              {trip.destination}, {trip.country}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push(`/plans/${slug}/edit`)}
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

      {/* Date range */}
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

      {/* Empty state */}
      {trip.days.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          <p>No days planned yet.</p>
          <button
            onClick={() => router.push(`/plans/${slug}/edit`)}
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
              onChange={(_: SyntheticEvent, v: number) => setSelectedDayIndex(v)}
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

          {/* Day detail */}
          {selectedDay && (
            <div className="mb-6 rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-b from-[#edf3f7] to-70% px-6 py-4">
                <h2 className="text-lg font-semibold text-[#0163a4]">
                  Day {selectedDayIndex + 1}: {selectedDay.title}
                </h2>
                <p className="text-[#0470b9] font-semibold inline-block px-4 py-1.5 rounded-md w-fit text-base shadow-sm mt-1 bg-[#0470b91a]">
                  {selectedDay.date}
                </p>
              </div>

              {selectedDay.activities.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-400 text-sm bg-white">
                  No activities for this day yet.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {selectedDay.activities.map((act, idx) => (
                    <ActivityItem
                      key={act.id}
                      act={act}
                      highlight={isCurrentActivity(selectedDayIndex, idx)}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
