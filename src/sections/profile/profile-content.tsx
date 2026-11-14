'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { Pencil, Share2 } from 'lucide-react'

import { followUser, getProfile, unfollowUser } from '@/api/profile'
import { unblockUser } from '@/api/safety'
import NotFound from '@/components/not-found'
import PageLoading from '@/components/page-loading'
import { type TripCardData, TripGrid } from '@/components/trip-card'
import { Button, ButtonLink } from '@/components/ui/button'
import { EmptyCard } from '@/components/ui/list'
import UserAvatar from '@/components/user-avatar'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { copyText } from '@/lib/clipboard'
import { coverGradient } from '@/lib/cover-gradient'
import { errorSummary } from '@/lib/error-summary'
import { followButton } from '@/lib/follow-button'
import { groupCalendar } from '@/lib/profile-calendar'
import { loginPath } from '@/lib/safe-next'
import { safeMediaUrl } from '@/lib/safe-url'
import { liveLabel } from '@/lib/trip-status'
import { buttonClass, cn } from '@/lib/ui-classes'
import BlockMenu from '@/sections/safety/block-menu'

import EditProfileDialog from './edit-profile-dialog'

import type { JourneyStatusType } from '@/api/journey/type'
import type { ProfileView } from '@/api/profile/type'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// TripCard joins destination and country; drop the country when the destination already has it.
const cardData = (t: {
  slug: string
  title: string
  destination: string
  country?: string
  cover_url?: string
  status?: JourneyStatusType
}): TripCardData => ({
  slug: t.slug,
  title: t.title,
  destination: t.destination,
  country: !t.country || t.destination.includes(t.country) ? undefined : t.country,
  coverUrl: t.cover_url,
  status: t.status,
})

function ProfileTripGrid({ trips }: { trips: Parameters<typeof cardData>[0][] }) {
  return <TripGrid trips={trips.map(cardData)} />
}

type TabKey = 'upcoming' | 'calendar' | 'past'

const TAB_LABELS: Record<TabKey, string> = {
  upcoming: 'Upcoming',
  calendar: 'Calendar',
  past: 'Past',
}

// Underline tabs (WAI-ARIA tabs pattern: arrow/Home/End keys move between tabs).
function ProfileTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: TabKey[]
  active: TabKey
  onChange: (tab: TabKey) => void
}) {
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const i = tabs.indexOf(active)
    const to =
      e.key === 'ArrowRight'
        ? (i + 1) % tabs.length
        : e.key === 'ArrowLeft'
          ? (i - 1 + tabs.length) % tabs.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? tabs.length - 1
              : -1
    if (to < 0) return
    e.preventDefault()
    const next = tabs[to]
    onChange(next)
    document.getElementById(`profile-tab-${next}`)?.focus()
  }
  return (
    <div
      role="tablist"
      aria-label="Trips"
      onKeyDown={onKeyDown}
      className="mb-5 flex gap-6 overflow-x-auto border-b border-line"
    >
      {tabs.map((t) => {
        const selected = t === active
        return (
          <button
            key={t}
            id={`profile-tab-${t}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`profile-panel-${t}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(t)}
            className={cn(
              '-mb-px whitespace-nowrap rounded-t-md border-b-2 px-0.5 pb-2.5 pt-1 text-sm font-medium leading-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent',
              selected ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {TAB_LABELS[t]}
          </button>
        )
      })}
    </div>
  )
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-tile bg-surface px-3 py-3 text-center shadow-soft">
      <span className="block text-xl font-semibold leading-normal tracking-tight text-ink">
        {value}
      </span>
      <span className="block truncate text-xs leading-normal text-muted">{label}</span>
    </div>
  )
}

export default function ProfileContent({ username }: { username: string }) {
  const router = useRouter()
  const { showToast } = useToast()
  const { status, user: me } = useAuth()
  // The result is tagged with the username it was loaded for, so a new username shows the
  // loading state instead of the previous profile.
  const [result, setResult] = useState<{
    username: string
    profile?: ProfileView
    error?: 'not-found' | 'failed'
  } | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  // The new username right after the owner renamed themselves (until navigation completes).
  const [renamedTo, setRenamedTo] = useState<string | null>(null)
  // null = the first tab that has trips.
  const [tab, setTab] = useState<TabKey | null>(null)

  // Re-load once auth is known: the token changes what the viewer is allowed to see.
  const authKey = status === 'loading' ? 'loading' : (me?.id ?? 'anon')
  useEffect(() => {
    if (authKey === 'loading') return
    let cancelled = false
    getProfile(username)
      .then((p) => {
        if (!cancelled) setResult({ username, profile: p })
      })
      .catch((err) => {
        if (cancelled) return
        const notFound = (err as { response?: { status?: number } }).response?.status === 404
        setResult({ username, error: notFound ? 'not-found' : 'failed' })
        console.error('Failed to load profile:', errorSummary(err))
      })
    return () => {
      cancelled = true
    }
  }, [username, authKey, attempt])

  if (status === 'loading' || !result || result.username !== username) return <PageLoading />
  if (result.error === 'not-found') {
    return (
      <NotFound
        message="Profile not found"
        description="This user doesn't exist or may have changed their username."
      />
    )
  }
  if (result.error || !result.profile) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-10">
        <EmptyCard
          action={
            <button
              type="button"
              onClick={() => {
                setResult(null)
                setAttempt((n) => n + 1)
              }}
              className={buttonClass('primary', 'md')}
            >
              Retry
            </button>
          }
        >
          Could not load this profile.
        </EmptyCard>
      </div>
    )
  }
  const profile = result.profile
  const setProfile = (p: ProfileView) => setResult({ username, profile: p })

  const own =
    !!me &&
    (me.username === profile.user.username || (renamedTo !== null && me.username === renamedTo))
  const followState = followButton(profile)
  const toggleFollow = async () => {
    if (!me) {
      router.push(loginPath(`/u/${encodeURIComponent(profile.user.username)}`))
      return
    }
    if (busy) return
    setBusy(true)
    try {
      const state =
        followState.action === 'follow'
          ? await followUser(profile.user.username)
          : await unfollowUser(profile.user.username)
      setProfile({
        ...profile,
        is_following: state.is_following,
        follow_requested: state.requested ?? false,
        followers: state.followers,
      })
    } catch (err) {
      showToast('Could not update follow', 'error')
      console.error('Failed to update follow:', errorSummary(err))
    } finally {
      setBusy(false)
    }
  }

  const reloadProfile = () => {
    setResult(null)
    setAttempt((n) => n + 1)
  }
  const unblock = async () => {
    if (busy) return
    setBusy(true)
    try {
      await unblockUser(profile.user.username)
      reloadProfile()
    } catch (err) {
      showToast('Unblock ไม่สำเร็จ', 'error')
      console.error('Failed to unblock:', errorSummary(err))
    } finally {
      setBusy(false)
    }
  }

  const share = async () => {
    const url = `${window.location.origin}/u/${encodeURIComponent(profile.user.username)}`
    if (await copyText(url)) showToast('Link copied')
    else showToast('Could not copy the link', 'error')
  }

  const { years, hidden } = groupCalendar(profile.calendar)
  const upcoming = profile.upcoming ?? []
  const past = profile.past ?? []
  const { stats } = profile
  const tabs: TabKey[] = profile.is_blocked
    ? []
    : [
        ...(upcoming.length > 0 ? (['upcoming'] as const) : []),
        ...(years.length > 0 || hidden.length > 0 ? (['calendar'] as const) : []),
        ...(past.length > 0 || stats.trips > 0 ? (['past'] as const) : []),
      ]
  const activeTab = tab && tabs.includes(tab) ? tab : tabs[0]
  const nowCover = safeMediaUrl(profile.now?.cover_url)

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-10 md:pt-6">
      {editing && me && (
        <EditProfileDialog
          user={me}
          onClose={() => setEditing(false)}
          onSaved={(updated, { acceptedPending }) => {
            setEditing(false)
            if (updated.username !== profile.user.username) {
              setRenamedTo(updated.username)
              router.push(`/u/${encodeURIComponent(updated.username)}`)
            } else if (acceptedPending) {
              // Pending requests became followers: refetch in place for the new count.
              setAttempt((n) => n + 1)
            } else
              setProfile({
                ...profile,
                user: {
                  ...profile.user,
                  display_name: updated.display_name,
                  bio: updated.bio,
                  avatar_url: updated.avatar_url,
                },
              })
          }}
        />
      )}

      <header>
        <div
          aria-hidden
          className="-mx-4 h-[150px] md:mx-0 md:h-[220px] md:rounded-card"
          style={{ backgroundImage: coverGradient(profile.user.username) }}
        />
        <div className="md:px-6">
          {/* Positioned (no z-index) so it paints over the banner without a stacking context. */}
          <span className="relative -mt-[42px] flex w-fit rounded-full ring-4 ring-bg">
            <UserAvatar user={profile.user} size={84} />
          </span>
          <h1 className="mt-2 break-words text-[22px] font-semibold leading-snug tracking-tight text-ink">
            {profile.user.display_name || profile.user.username}
          </h1>
          <p className="break-words text-sm leading-normal text-muted">@{profile.user.username}</p>
          {profile.user.bio && (
            <p className="mt-2 whitespace-pre-line break-words text-sm leading-normal text-ink-2">
              {profile.user.bio}
            </p>
          )}

          <div className="mt-4 flex items-center gap-2">
            {own ? (
              <Button variant="secondary" onClick={() => setEditing(true)}>
                <Pencil size={16} aria-hidden className="flex-shrink-0" />
                Edit profile
              </Button>
            ) : profile.is_blocked ? null : (
              <Button
                variant={followState.action !== 'follow' ? 'secondary' : 'primary'}
                onClick={toggleFollow}
                disabled={busy}
                title={followState.action === 'cancel' ? 'Cancel follow request' : undefined}
                aria-label={
                  followState.action === 'cancel' ? 'Requested, cancel follow request' : undefined
                }
                className="flex-1 sm:flex-none sm:px-8"
              >
                {followState.label}
              </Button>
            )}
            <Button variant="secondary" onClick={() => void share()}>
              <Share2 size={16} aria-hidden className="flex-shrink-0" />
              Share
            </Button>
            {!own && me && (
              // Right edge: the menu opens right-aligned, so it never clips off-screen.
              <div className="ml-auto">
                <BlockMenu
                  username={profile.user.username}
                  isBlocked={!!profile.is_blocked}
                  onChanged={reloadProfile}
                />
              </div>
            )}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 sm:max-w-md">
            {/* stats.trips counts completed trips only. */}
            <Stat value={stats.trips} label={stats.trips === 1 ? 'trip taken' : 'trips taken'} />
            <Stat value={profile.followers} label="followers" />
            <Stat value={profile.following} label="following" />
          </div>
        </div>
      </header>

      {profile.is_blocked && !own && (
        <div className="mt-8 rounded-card bg-surface p-8 text-center shadow-soft">
          <p className="mb-3 text-sm text-muted">คุณ block คนนี้อยู่</p>
          <button
            type="button"
            onClick={() => void unblock()}
            disabled={busy}
            className={buttonClass('secondary', 'md')}
          >
            Unblock
          </button>
        </div>
      )}

      {!profile.is_blocked && profile.now?.live && (
        <section className="mt-8">
          <h2 className="mb-3 text-base font-semibold tracking-tight text-ink">Now</h2>
          <a
            href={`/plans/${encodeURIComponent(profile.now.slug)}`}
            className="flex items-center gap-4 overflow-hidden rounded-card bg-surface p-3 shadow-soft transition-transform duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {nowCover ? (
              // eslint-disable-next-line @next/next/no-img-element -- static export, remote cover
              <img
                src={nowCover}
                alt=""
                referrerPolicy="no-referrer"
                loading="lazy"
                className="h-16 w-16 flex-shrink-0 rounded-tile bg-chip object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="block h-16 w-16 flex-shrink-0 rounded-tile"
                style={{ backgroundImage: coverGradient(profile.now.slug) }}
              />
            )}
            <span className="min-w-0 flex-1">
              <span className="flex items-start gap-2 text-sm font-semibold leading-normal text-live-ink">
                <span
                  aria-hidden
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-live ring-4 ring-live/25"
                />
                {liveLabel({
                  city: profile.now.live.city,
                  dayNumber: profile.now.live.day_number,
                  totalDays: profile.now.live.total_days,
                })}
              </span>
              <span className="mt-0.5 block truncate text-sm leading-normal text-ink-2">
                {profile.now.title}
              </span>
            </span>
          </a>
        </section>
      )}

      {!profile.is_blocked && !activeTab && (
        <EmptyCard
          className="mt-8"
          action={
            own ? (
              <ButtonLink href="/plans/create" variant="secondary" size="sm">
                Create Plan
              </ButtonLink>
            ) : undefined
          }
        >
          No trips to show yet.
        </EmptyCard>
      )}

      {activeTab && (
        <section className="mt-8">
          <ProfileTabs tabs={tabs} active={activeTab} onChange={setTab} />
          <div
            role="tabpanel"
            id={`profile-panel-${activeTab}`}
            aria-labelledby={`profile-tab-${activeTab}`}
          >
            {activeTab === 'upcoming' && <ProfileTripGrid trips={upcoming} />}

            {activeTab === 'calendar' && (
              <div className="space-y-6">
                {years.map((y) => (
                  <div key={y.year}>
                    <h3 className="mb-3 text-sm font-semibold text-ink">{y.year}</h3>
                    {y.months.map((m) => (
                      <div key={m.month} className="mb-5">
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                          {MONTHS[m.month - 1]}
                        </h4>
                        <ProfileTripGrid trips={m.items} />
                      </div>
                    ))}
                  </div>
                ))}
                {hidden.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-sm font-semibold text-muted">Dates hidden</h3>
                    <ProfileTripGrid trips={hidden} />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'past' && (
              <>
                <p className="mb-4 text-sm leading-normal text-muted">
                  {stats.countries} {stats.countries === 1 ? 'country' : 'countries'} ·{' '}
                  {stats.cities} {stats.cities === 1 ? 'city' : 'cities'} · {stats.trips}{' '}
                  {stats.trips === 1 ? 'trip' : 'trips'}
                </p>
                <ProfileTripGrid trips={past} />
              </>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
