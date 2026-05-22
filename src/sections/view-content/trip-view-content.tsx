'use client'

import { type SyntheticEvent } from 'react'

import { useRouter } from 'next/navigation'

import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { MapPin } from 'lucide-react'

import ConfirmDialog from '@/components/confirm-dialog'
import NotFound from '@/components/not-found'
import PageLoading from '@/components/page-loading'
import { useTheme } from '@/contexts/theme-context'

import TripActionMenu from './trip-action-menu'
import TripDayDetail from './trip-day-detail'
import { useTripView } from './use-trip-view'

export default function TripViewContent({ slug }: { slug: string }) {
  const router = useRouter()
  const { theme } = useTheme()
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
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{trip.title}</h1>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            <MapPin size={13} />
            <span>
              {trip.destination}, {trip.country}
            </span>
          </div>
        </div>
        <TripActionMenu slug={slug} trip={trip} onDelete={() => setConfirmOpen(true)} />
      </div>

      {/* Date range */}
      <p className="font-semibold text-[#0470b9] dark:text-[#5fb3f5] text-sm mb-6">
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
        <div className="bg-white dark:bg-[#2c2c36] rounded-2xl shadow-sm border border-gray-200 dark:border-[#3c3c4a] p-8 text-center text-gray-500 dark:text-gray-400">
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
          <Box
            sx={{
              borderBottom: 1,
              borderColor: theme === 'dark' ? '#3c3c4a' : 'divider',
              mb: 3,
            }}
          >
            <Tabs
              value={selectedDayIndex}
              onChange={(_: SyntheticEvent, v: number) => setSelectedDayIndex(v)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                '& .MuiTab-root': {
                  color: theme === 'dark' ? '#9a9aaa' : undefined,
                },
                '& .MuiTab-root.Mui-selected': {
                  color: theme === 'dark' ? '#5fb3f5' : '#4f46e5',
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: theme === 'dark' ? '#5fb3f5' : '#4f46e5',
                },
              }}
            >
              {trip.days.map((day, idx) => (
                <Tab
                  key={day.id}
                  label={
                    <div className="text-center">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Day {idx + 1}</div>
                      <div className="font-semibold">{day.date}</div>
                    </div>
                  }
                  sx={{ textTransform: 'none', transition: 'all 0.3s ease' }}
                />
              ))}
            </Tabs>
          </Box>

          {/* Day detail */}
          {selectedDay && (
            <TripDayDetail
              day={selectedDay}
              dayIndex={selectedDayIndex}
              isCurrentActivity={(actIdx) => isCurrentActivity(selectedDayIndex, actIdx)}
            />
          )}
        </>
      )}
    </div>
  )
}
