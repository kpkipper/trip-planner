'use client'

import { useEffect, useState } from 'react'

import { useRouter } from 'next/navigation'

import { MapPin, Radio } from 'lucide-react'

import { followUser, getProfile, unfollowUser } from '@/api/profile'
import NotFound from '@/components/not-found'
import PageLoading from '@/components/page-loading'
import UserAvatar from '@/components/user-avatar'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/contexts/toast-context'
import { errorSummary } from '@/lib/error-summary'
import { groupCalendar } from '@/lib/profile-calendar'
import { loginPath } from '@/lib/safe-next'
import { liveLabel } from '@/lib/trip-status'

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
      href={`/plans/${slug}`}
      className="block rounded-xl border border-gray-200 bg-white p-3 hover:border-[#16aef2]"
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
  const [profile, setProfile] = useState<ProfileView | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)

  // Re-load once auth is known: the token changes what the viewer is allowed to see.
  const authKey = status === 'loading' ? 'loading' : (me?.id ?? 'anon')
  useEffect(() => {
    if (authKey === 'loading') return
    let cancelled = false
    getProfile(username)
      .then((p) => {
        if (cancelled) return
        setProfile(p)
        setNotFound(false)
      })
      .catch((err) => {
        if (cancelled) return
        const code = (err as { response?: { status?: number } }).response?.status
        if (code !== 404) showToast('Could not load this profile', 'error')
        setNotFound(true)
        console.error('Failed to load profile:', errorSummary(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [username, authKey, showToast])

  if (loading || status === 'loading') return <PageLoading />
  if (notFound || !profile) {
    return (
      <NotFound
        message="Profile not found"
        description="This user doesn't exist or may have changed their username."
      />
    )
  }

  const own = !!me && me.username === profile.user.username
  const toggleFollow = async () => {
    if (!me) {
      router.push(loginPath(`/u/${profile.user.username}`))
      return
    }
    if (busy) return
    setBusy(true)
    try {
      const state = profile.is_following
        ? await unfollowUser(profile.user.username)
        : await followUser(profile.user.username)
      setProfile({ ...profile, is_following: state.is_following, followers: state.followers })
    } catch (err) {
      showToast('Could not update follow', 'error')
      console.error('Failed to update follow:', errorSummary(err))
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
          onSaved={(updated) => {
            setEditing(false)
            if (updated.username !== profile.user.username) router.push(`/u/${updated.username}`)
            else
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
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Edit profile
          </button>
        ) : (
          <button
            type="button"
            onClick={toggleFollow}
            disabled={busy}
            className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
              profile.is_following
                ? 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-[#0163a4] text-white hover:bg-[#0470b9]'
            }`}
          >
            {profile.is_following ? 'Unfollow' : 'Follow'}
          </button>
        )}
      </header>

      {profile.now?.live && (
        <Section title="Now">
          <a
            href={`/plans/${profile.now.slug}`}
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

      {upcoming.length > 0 && (
        <Section title="Upcoming">
          <TripList trips={upcoming} />
        </Section>
      )}

      {(years.length > 0 || hidden.length > 0) && (
        <Section title="Calendar">
          <div className="space-y-5">
            {years.map((y) => (
              <div key={y.year}>
                <h3 className="mb-2 text-sm font-bold text-[#0163a4]">{y.year}</h3>
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

      {(past.length > 0 || stats.trips > 0) && (
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
