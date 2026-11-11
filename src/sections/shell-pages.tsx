'use client'

import NotFound from '@/components/not-found'
import PageLoading, { TripPageSkeleton } from '@/components/page-loading'
import { useShellParam } from '@/lib/use-shell-param'

import CreateEditContent from './create-edit-content/create-edit-content'
import JoinContent from './join/join-content'
import ProfileContent from './profile/profile-content'
import TripViewContent from './view-content/trip-view-content'

// Each wrapper resolves the real route param: prerendered pages get it as a
// prop, the `_shell` placeholder reads it from location.pathname.

export function TripViewShell({ slug }: { slug: string }) {
  const value = useShellParam(slug, '/plans')
  if (value === undefined) return <TripPageSkeleton />
  if (value === null) return <NotFound />
  return <TripViewContent slug={value} key={value} />
}

export function TripEditShell({ slug }: { slug: string }) {
  const value = useShellParam(slug, '/plans')
  if (value === undefined) return <PageLoading />
  if (value === null) return <NotFound />
  return <CreateEditContent slug={value} key={value} />
}

export function ProfileShell({ username }: { username: string }) {
  const value = useShellParam(username, '/u')
  if (value === undefined) return <PageLoading />
  if (value === null) return <NotFound />
  return <ProfileContent username={value} key={value} />
}

export function JoinShell({ token }: { token: string }) {
  const value = useShellParam(token, '/join')
  if (value === undefined) return <PageLoading />
  if (value === null) return <NotFound />
  return <JoinContent token={value} key={value} />
}
