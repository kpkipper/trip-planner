'use client'

import NotFound from '@/components/not-found'
import PageLoading from '@/components/page-loading'
import { useShellParam } from '@/lib/use-shell-param'

import CreateEditContent from './create-edit-content/create-edit-content'
import JoinContent from './join/join-content'
import TripViewContent from './view-content/trip-view-content'

// Each wrapper resolves the real route param: prerendered pages get it as a
// prop, the `_shell` placeholder reads it from location.pathname.

export function TripViewShell({ slug }: { slug: string }) {
  const value = useShellParam(slug, '/plans')
  if (value === undefined) return <PageLoading />
  if (value === null) return <NotFound />
  return <TripViewContent slug={value} />
}

export function TripEditShell({ slug }: { slug: string }) {
  const value = useShellParam(slug, '/plans')
  if (value === undefined) return <PageLoading />
  if (value === null) return <NotFound />
  return <CreateEditContent slug={value} />
}

export function ProfileShell({ username }: { username: string }) {
  const value = useShellParam(username, '/u')
  if (value === undefined) return <PageLoading />
  if (value === null) return <NotFound />
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Profile coming soon</h1>
      <p className="text-gray-600">@{value}</p>
    </div>
  )
}

export function JoinShell({ token }: { token: string }) {
  const value = useShellParam(token, '/join')
  if (value === undefined) return <PageLoading />
  if (value === null) return <NotFound />
  return <JoinContent token={value} />
}
