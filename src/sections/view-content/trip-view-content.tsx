'use client'

import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react'

import { useRouter } from 'next/navigation'

import { MapPin, Radio } from 'lucide-react'

import ConfirmDialog from '@/components/confirm-dialog'
import NotFound from '@/components/not-found'
import { TripPageSkeleton } from '@/components/page-loading'
import { Card } from '@/components/ui/card'
import { coverGradient } from '@/lib/cover-gradient'
import { groupMoments } from '@/lib/moments-by-day'
import { safeHttpsUrl } from '@/lib/safe-url'
import { tripActions } from '@/lib/trip-roles'
import { liveLabel } from '@/lib/trip-status'
import { chipClass, cn } from '@/lib/ui-classes'
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

import type { TripDay } from '@/types/trip'

const shortDate = (iso: string) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)

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

  if (loading || deleting) return <TripPageSkeleton />
  if (notFound || !trip) return <NotFound />

  const selectedDay = trip.days[selectedDayIndex]
  const coverUrl = safeHttpsUrl(trip.coverUrl)
  const todayPlans = trip.live?.todayPlans ?? []
  const livePlanIds = new Set(todayPlans.map((p) => p.id))
  const place = [trip.destination, trip.country].filter(Boolean).join(', ')
  const dates =
    !trip.redacted && trip.startDate && trip.endDate
      ? `${shortDate(trip.startDate)} – ${shortDate(trip.endDate)}`
      : ''
  const ownerName = trip.owner ? trip.owner.displayName || trip.owner.username : ''
  const planCount = trip.days.reduce((n, d) => n + d.activities.length, 0)
  const stats = trip.redacted
    ? []
    : [
        { value: trip.days.length, label: plural(trip.days.length, 'day', 'days') },
        { value: planCount, label: plural(planCount, 'plan', 'plans') },
        ...(showMoments
          ? [{ value: moments.length, label: plural(moments.length, 'story', 'stories') }]
          : []),
      ]
  const hasMembers = !!trip.owner || (trip.members ?? []).some((m) => m.status !== 'invited')

  return (
    <UploadStoreProvider store={uploadStore}>
      <div className="px-4 pt-4 pb-10 md:pt-6">
        <ConfirmDialog
          open={confirmOpen}
          title="Delete this trip?"
          description="This action cannot be undone. The trip and all its data will be permanently removed. All photos and videos from every member of this trip will be deleted too."
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

        {/* Hero: cover photo (or the slug's gradient) with a dark bottom fade. The action menu
            sits outside the clipped layer so its dropdown is not cut off. */}
        <section className="relative">
          <div
            className="relative flex min-h-60 flex-col justify-end overflow-hidden rounded-card bg-primary md:min-h-[340px]"
            style={coverUrl ? undefined : { backgroundImage: coverGradient(slug) }}
          >
            {coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- static export, remote cover
              <img
                src={coverUrl}
                alt=""
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            {/* Scrims: bottom for the title block, top for the action menu, so both read on
                bright covers and the lighter gradient palettes. */}
            <div
              aria-hidden
              className="absolute inset-0 bg-linear-to-t from-black/65 via-black/35 to-transparent"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-2/5 bg-linear-to-b from-black/35 to-transparent"
            />
            <div className="relative px-5 pt-16 pb-6 text-white md:px-8 md:pb-7">
              <StatusBadge status={trip.status} variant="glass" />
              <h1 className="mt-3 break-words text-[28px] font-semibold leading-snug tracking-tight md:text-[44px]">
                {trip.title}
              </h1>
              {(place || dates || ownerName) && (
                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 text-sm leading-normal text-white/85 md:text-base">
                  {place && (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <MapPin size={14} className="shrink-0" />
                      <span className="break-words">{place}</span>
                    </span>
                  )}
                  {place && dates && <span aria-hidden>·</span>}
                  {dates && <span>{dates}</span>}
                  {ownerName && (place || dates) && <span aria-hidden>·</span>}
                  {ownerName && <span className="min-w-0 break-words">by {ownerName}</span>}
                </p>
              )}
            </div>
          </div>
          {/* No z-index here: a stacking context would trap the menu's ReportDialog (z-50)
              below the nav bars (z-30). The wrapper still paints above the hero (DOM order). */}
          <div className="absolute top-4 right-4 md:top-5 md:right-5">
            <TripActionMenu
              slug={slug}
              trip={trip}
              variant="glass"
              onDelete={() => setConfirmOpen(true)}
              onLeave={() => setLeaveOpen(true)}
            />
          </div>
        </section>

        {/* One column below lg (day content, side card, panels); at lg the side card spans the
            right column next to the day content and the panels. */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_1fr] lg:items-start">
          <div className="min-w-0 space-y-6 lg:col-start-1">
            {trip.redacted ? (
              <Card padding="p-8" className="text-center leading-normal text-muted">
                <p>Details will be visible after the trip ends.</p>
              </Card>
            ) : (
              <>
                {trip.live && (
                  <Card padding="p-5">
                    <p className="flex items-center gap-2 text-sm font-semibold leading-normal text-live-ink">
                      <Radio size={14} />
                      {liveLabel(trip.live)}
                    </p>
                    {todayPlans.length > 0 && (
                      <ul className="mt-2 space-y-1 text-sm leading-normal text-ink-2">
                        {todayPlans.map((p) => (
                          <li key={p.id} className="flex gap-3">
                            <span className="w-12 shrink-0 tabular-nums font-semibold text-live-ink">
                              {p.time}
                            </span>
                            <span className="min-w-0 break-words font-medium">{p.description}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                )}

                {trip.days.length === 0 ? (
                  <Card padding="p-8" className="text-center leading-normal text-muted">
                    <p>No days planned yet.</p>
                    {tripActions(trip.role, trip.redacted ?? false).edit && (
                      <button
                        onClick={() => router.push(`/plans/${slug}/edit`)}
                        className="mt-3 rounded text-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        Edit plan to add days
                      </button>
                    )}
                  </Card>
                ) : (
                  <Card padding="p-4 sm:p-6">
                    <DayChips
                      days={trip.days}
                      selected={selectedDayIndex}
                      onSelect={setSelectedDayIndex}
                    />
                    {selectedDay && (
                      <div
                        role="tabpanel"
                        id="trip-day-panel"
                        aria-labelledby={`trip-day-tab-${selectedDayIndex}`}
                        className="mt-5"
                      >
                        <TripDayDetail
                          day={selectedDay}
                          dayIndex={selectedDayIndex}
                          isCurrentActivity={(actIdx) =>
                            isCurrentActivity(selectedDayIndex, actIdx)
                          }
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
                      </div>
                    )}
                  </Card>
                )}
              </>
            )}
          </div>

          {(stats.length > 0 || hasMembers) && (
            <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1">
              <Card className="space-y-5">
                {stats.length > 0 && (
                  <dl className="grid grid-cols-3 gap-2">
                    {stats.map((st) => (
                      <div
                        key={st.label}
                        className="flex flex-col-reverse rounded-tile bg-bg px-2 py-3 text-center"
                      >
                        <dt className="text-xs leading-normal text-muted">{st.label}</dt>
                        <dd className="text-xl font-semibold leading-normal tracking-tight text-ink tabular-nums">
                          {st.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                )}
                <MembersRow trip={trip} />
              </Card>
            </aside>
          )}

          <div className="flex min-w-0 flex-col gap-6 empty:hidden lg:col-start-1 [&>section]:mt-0">
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
        </div>
      </div>
    </UploadStoreProvider>
  )
}

// Day picker: chips with the weekday small and the date big; the selected one is filled.
// Tab semantics with arrow/Home/End keys, like the MUI tabs it replaces.
function DayChips({
  days,
  selected,
  onSelect,
}: {
  days: TripDay[]
  selected: number
  onSelect: (i: number) => void
}) {
  const listRef = useRef<HTMLDivElement>(null)

  // Keep the selected chip in view (e.g. today's day on a long trip) without scrolling the page.
  useEffect(() => {
    const list = listRef.current
    const chip = list?.children[selected] as HTMLElement | undefined
    if (!list || !chip) return
    list.scrollTo({ left: chip.offsetLeft - (list.clientWidth - chip.offsetWidth) / 2 })
  }, [selected])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = days.length - 1
    const next =
      e.key === 'ArrowRight'
        ? Math.min(selected + 1, last)
        : e.key === 'ArrowLeft'
          ? Math.max(selected - 1, 0)
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : null
    if (next === null) return
    e.preventDefault()
    onSelect(next)
    ;(listRef.current?.children[next] as HTMLElement | undefined)?.focus()
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="Days"
      onKeyDown={onKeyDown}
      className="relative -mx-1 flex gap-2 overflow-x-auto px-1 pt-1 pb-2"
    >
      {days.map((day, idx) => {
        const active = idx === selected
        const d = day.dateISO ? new Date(day.dateISO + 'T12:00:00') : null
        const valid = !!d && !Number.isNaN(d.getTime())
        return (
          <button
            key={day.id}
            id={`trip-day-tab-${idx}`}
            type="button"
            role="tab"
            aria-selected={active}
            aria-controls="trip-day-panel"
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect(idx)}
            className={cn(
              chipClass(active),
              'relative min-w-14 shrink-0 flex-col gap-0 rounded-tile px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              !active && 'hover:bg-line',
            )}
          >
            <span className="sr-only">
              Day {idx + 1} · {day.date}
            </span>
            <span aria-hidden className={cn('text-xs', active ? 'text-white/70' : 'text-muted')}>
              {valid ? d.toLocaleDateString('en-US', { weekday: 'short' }) : 'Day'}
            </span>
            <span aria-hidden className="text-lg font-semibold">
              {valid ? d.getDate() : idx + 1}
            </span>
            <DayUploadingMark dayId={day.id} />
          </button>
        )
      })}
    </div>
  )
}
