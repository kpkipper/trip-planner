import { cn } from '@/lib/ui-classes'

import type { ReactNode } from 'react'

// Loading states. A quiet spinner where the page shape is unknown; skeleton blocks where it is
// (feed list, trip grid, trip page) so the layout does not jump when content arrives.

function Loading({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-label="Loading…" aria-busy="true" className={className}>
      {children}
    </div>
  )
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div aria-hidden className={cn('animate-pulse rounded-tile bg-chip', className)} />
}

export default function PageLoading() {
  return (
    <Loading className="flex min-h-[60dvh] items-center justify-center">
      <span
        aria-hidden
        className="h-6 w-6 animate-spin rounded-full border-2 border-chip border-t-muted"
      />
    </Loading>
  )
}

/** Feed cards: cover, avatar and two text lines. Goes inside the feed's own column. */
export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Loading className="flex flex-col gap-4 md:gap-5">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-card bg-surface shadow-soft">
          <SkeletonBlock className="h-[150px] rounded-none sm:h-[220px]" />
          <div className="flex items-start gap-3 px-4 pb-4 pt-3">
            <SkeletonBlock className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2 pt-1">
              <SkeletonBlock className="h-3.5 w-4/5" />
              <SkeletonBlock className="h-3 w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </Loading>
  )
}

/** Trip card grid, matching TripGrid (components/trip-card). */
export function TripGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <Loading className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-card bg-surface shadow-soft">
          <SkeletonBlock className="aspect-[16/10] rounded-none" />
          <div className="space-y-2 p-4">
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-3.5 w-1/2" />
          </div>
        </div>
      ))}
    </Loading>
  )
}

/** Trip page: hero, day card and the side card. Includes the page padding. */
export function TripPageSkeleton() {
  return (
    <Loading className="px-4 pt-4 pb-10 md:pt-6">
      <SkeletonBlock className="min-h-60 rounded-card md:min-h-[340px]" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-5 rounded-card bg-surface p-4 shadow-soft sm:p-6">
          <div className="flex gap-2">
            {Array.from({ length: 5 }, (_, i) => (
              <SkeletonBlock key={i} className="h-14 w-14 shrink-0" />
            ))}
          </div>
          <SkeletonBlock className="h-4 w-2/3" />
          <SkeletonBlock className="h-4 w-1/2" />
          <SkeletonBlock className="h-4 w-3/5" />
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-card bg-surface p-6 shadow-soft">
          {Array.from({ length: 3 }, (_, i) => (
            <SkeletonBlock key={i} className="h-16" />
          ))}
        </div>
      </div>
    </Loading>
  )
}
