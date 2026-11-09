'use client'

import { type SyntheticEvent, useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import Box from '@mui/material/Box'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import { MapPin, Radio } from 'lucide-react'

import ConfirmDialog from '@/components/confirm-dialog'
import NotFound from '@/components/not-found'
import PageLoading from '@/components/page-loading'
import { groupMoments } from '@/lib/moments-by-day'
import { safeHttpsUrl } from '@/lib/safe-url'
import { tripActions } from '@/lib/trip-roles'
import { liveLabel } from '@/lib/trip-status'
import { createUploadStore } from '@/lib/upload-store'
import MembersPanel from '@/sections/members/members-panel'
import { DayUploadingMark, UploadStoreProvider } from '@/sections/moments/upload-context'
import { useMoments } from '@/sections/moments/use-moments'
import TripSettingsPanel from '@/sections/settings/trip-settings-panel'

import MembersRow from './members-row'
import StatusBadge from './status-badge'
import TripActionMenu from './trip-action-menu'
import TripDayDetail from './trip-day-detail'
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
    leaveOpen,
    setLeaveOpen,
    handleLeave,
    refresh,
  } = useTripView(slug)

  const showMoments = !!trip && !trip.redacted
  const { moments, reload: reloadMoments, onMediaError } = useMoments(slug, showMoments)
  const grouped = useMemo(() => groupMoments(moments), [moments])

  // Upload state lives at trip level so it survives day-tab switches.
  const [uploadStore] = useState(() => createUploadStore())
  useEffect(() => {
    uploadStore.setOnBatchDone(reloadMoments)
  }, [uploadStore, reloadMoments])

  if (loading || deleting) return <PageLoading />
  if (notFound || !trip) return <NotFound />

  const selectedDay = trip.days[selectedDayIndex]
  const coverUrl = safeHttpsUrl(trip.coverUrl)
  const todayPlans = trip.live?.todayPlans ?? []
  const livePlanIds = new Set(todayPlans.map((p) => p.id))

  return (
    <UploadStoreProvider store={uploadStore}>
      <div className="relative max-w-3xl mx-auto px-4 py-8">
        <ConfirmDialog
          open={confirmOpen}
          title="Delete this trip?"
          description="This action cannot be undone. The trip and all its data will be permanently removed. รูปและวิดีโอทั้งหมดของสมาชิกทุกคนในทริปนี้จะถูกลบไปด้วย"
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setConfirmOpen(false)}
        />

        <ConfirmDialog
          open={leaveOpen}
          title="Leave this trip?"
          description="You will lose access to this trip unless you are invited again."
          confirmLabel="Leave"
          onConfirm={handleLeave}
          onCancel={() => setLeaveOpen(false)}
        />

        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- static export, remote cover
          <img
            src={coverUrl}
            alt=""
            referrerPolicy="no-referrer"
            className="mb-4 h-48 w-full rounded-2xl object-cover bg-gray-100"
          />
        )}

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
          <TripActionMenu
            slug={slug}
            trip={trip}
            onDelete={() => setConfirmOpen(true)}
            onLeave={() => setLeaveOpen(true)}
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <StatusBadge status={trip.status} />
          <MembersRow trip={trip} />
        </div>

        {trip.redacted ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500 shadow-sm">
            <p>Details will be visible after the trip ends.</p>
          </div>
        ) : (
          <>
            {trip.live && (
              <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-green-700">
                  <Radio size={14} />
                  {liveLabel(trip.live)}
                </p>
                {todayPlans.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-gray-700">
                    {todayPlans.map((p) => (
                      <li key={p.id} className="flex gap-3">
                        <span className="w-12 shrink-0 font-mono tabular-nums text-green-700">
                          {p.time}
                        </span>
                        <span className="font-medium">{p.description}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Date range */}
            {trip.startDate && trip.endDate && (
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
            )}

            {/* Empty state */}
            {trip.days.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
                <p>No days planned yet.</p>
                {tripActions(trip.role, trip.redacted ?? false).edit && (
                  <button
                    onClick={() => router.push(`/plans/${slug}/edit`)}
                    className="mt-3 text-[#0163a4] hover:underline text-sm"
                  >
                    Edit plan to add days
                  </button>
                )}
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
                            <DayUploadingMark dayId={day.id} />
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
                  <TripDayDetail
                    day={selectedDay}
                    dayIndex={selectedDayIndex}
                    isCurrentActivity={(actIdx) => isCurrentActivity(selectedDayIndex, actIdx)}
                    livePlanIds={livePlanIds}
                    moments={{
                      slug,
                      role: trip.role,
                      settings: trip.settings,
                      dayMoments: grouped.byDay.get(selectedDay.id) ?? [],
                      planMoments: grouped.byPlan,
                      reload: reloadMoments,
                      onMediaError,
                    }}
                  />
                )}
              </>
            )}
          </>
        )}

        <TripSettingsPanel
          slug={slug}
          role={trip.role}
          visibility={trip.visibility}
          coverUrl={trip.coverUrl}
          settings={trip.settings}
          onChanged={refresh}
        />

        <MembersPanel
          slug={slug}
          role={trip.role}
          editorsCanInvite={trip.settings?.editorsCanInvite}
          onChanged={refresh}
        />
      </div>
    </UploadStoreProvider>
  )
}
