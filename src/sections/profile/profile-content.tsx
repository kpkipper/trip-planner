'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { MapPin, Radio } from 'lucide-react'

import { followUser, getProfile, unfollowUser } from '@/api/profile'
import { unblockUser } from '@/api/safety'
import NotFound from '@/components/not-found'
import PageLoading from '@/components/page-loading'
import UserAvatar from '@/components/user-avatar'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { errorSummary } from '@/lib/error-summary'
import { followButton } from '@/lib/follow-button'
import { groupCalendar } from '@/lib/profile-calendar'
import { loginPath } from '@/lib/safe-next'
import { liveLabel } from '@/lib/trip-status'
import { buttonClass } from '@/lib/ui-classes'
import BlockMenu from '@/sections/safety/block-menu'

import EditProfileDialog from './edit-profile-dialog'

import type { JourneyView } from '@/api/journey/type'
import type { CalendarItemType, ProfileView } from '@/api/profile/type'

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

const place = (destination: string, country = '') =>
  !country || destination.includes(country) ? destination : `${destination}, ${country}`

function TripLink({
  slug,
  title,
  destination,
  country,
}: {
  slug: string
  title: string
  destination: string
  country?: string
}) {
  return (
    <a
      href={`/plans/${encodeURIComponent(slug)}`}
      className="block rounded-tile bg-surface p-3 shadow-soft transition-shadow hover:ring-2 hover:ring-accent/40"
    >
      <span className="block text-sm font-semibold text-gray-800">{title}</span>
      <span className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
        <MapPin size={12} />
        {place(destination, country)}
      </span>
    </a>
  )
}

function TripList({ trips }: { trips: JourneyView[] }) {
  return (
    <ul className="space-y-2">
      {trips.map((t) => (
        <li key={t.slug}>
          <TripLink slug={t.slug} title={t.title} destination={t.destination} country={t.country} />
        </li>
      ))}
    </ul>
  )
}

function CalendarEntry({ item }: { item: CalendarItemType }) {
  return (
    <li>
      <TripLink
        slug={item.slug}
        title={item.title}
        destination={item.destination}
        country={item.country}
      />
    </li>
  )
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mt-8">
    <h2 className="mb-3 text-base font-semibold text-gray-800">{title}</h2>
    {children}
  </section>
)

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
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-sm text-gray-600">Could not load this profile.</p>
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

  const { years, hidden } = groupCalendar(profile.calendar)
  const upcoming = profile.upcoming ?? []
  const past = profile.past ?? []
  const { stats } = profile

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
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

      <header className="flex items-start gap-4">
        <UserAvatar user={profile.user} size={72} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-800">
            {profile.user.display_name || profile.user.username}
          </h1>
          <p className="text-sm text-gray-500">@{profile.user.username}</p>
          {profile.user.bio && (
            <p className="mt-2 whitespace-pre-line text-sm text-gray-700">{profile.user.bio}</p>
          )}
          <p className="mt-2 text-sm text-gray-600">
            <strong>{profile.followers}</strong> followers · <strong>{profile.following}</strong>{' '}
            following
          </p>
        </div>
        {own ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className={buttonClass('secondary', 'md')}
          >
            Edit profile
          </button>
        ) : profile.is_blocked ? null : (
          <button
            type="button"
            onClick={toggleFollow}
            disabled={busy}
            title={followState.action === 'cancel' ? 'Cancel follow request' : undefined}
            aria-label={followState.action === 'cancel' ? 'Requested, cancel follow request' : undefined}
            className={buttonClass(followState.action !== 'follow' ? 'secondary' : 'primary')}
          >
            {followState.label}
          </button>
        )}
        {!own && me && (
          <BlockMenu
            username={profile.user.username}
            isBlocked={!!profile.is_blocked}
            onChanged={reloadProfile}
          />
        )}
      </header>

      {profile.is_blocked && !own && (
        <div className="mt-8 rounded-card bg-surface p-8 text-center shadow-soft">
          <p className="mb-3 text-sm text-gray-600">คุณ block คนนี้อยู่</p>
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
        <Section title="Now">
          <a
            href={`/plans/${encodeURIComponent(profile.now.slug)}`}
            className="block rounded-2xl border border-green-200 bg-green-50 p-4"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-green-700">
              <Radio size={14} />
              {liveLabel({
                city: profile.now.live.city,
                dayNumber: profile.now.live.day_number,
                totalDays: profile.now.live.total_days,
              })}
            </span>
            <span className="mt-1 block text-sm text-gray-700">{profile.now.title}</span>
          </a>
        </Section>
      )}

      {!profile.is_blocked && upcoming.length > 0 && (
        <Section title="Upcoming">
          <TripList trips={upcoming} />
        </Section>
      )}

      {!profile.is_blocked && (years.length > 0 || hidden.length > 0) && (
        <Section title="Calendar">
          <div className="space-y-5">
            {years.map((y) => (
              <div key={y.year}>
                <h3 className="mb-2 text-sm font-bold text-ink">{y.year}</h3>
                {y.months.map((m) => (
                  <div key={m.month} className="mb-3">
                    <h4 className="mb-1 text-xs font-semibold uppercase text-gray-500">
                      {MONTHS[m.month - 1]}
                    </h4>
                    <ul className="space-y-2">
                      {m.items.map((item) => (
                        <CalendarEntry key={item.slug} item={item} />
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ))}
            {hidden.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-bold text-gray-500">Dates hidden</h3>
                <ul className="space-y-2">
                  {hidden.map((item) => (
                    <CalendarEntry key={item.slug} item={item} />
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {!profile.is_blocked && (past.length > 0 || stats.trips > 0) && (
        <Section title="Past">
          <p className="mb-3 text-sm text-gray-600">
            {stats.countries} {stats.countries === 1 ? 'country' : 'countries'} · {stats.cities}{' '}
            {stats.cities === 1 ? 'city' : 'cities'} · {stats.trips}{' '}
            {stats.trips === 1 ? 'trip' : 'trips'}
          </p>
          <TripList trips={past} />
        </Section>
      )}
    </div>
  )
}
