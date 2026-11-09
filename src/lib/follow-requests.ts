import type { FollowEntry } from '@/api/follows/type'

// Window event fired after the pending list changes, so the sidebar badge refetches.
export const FOLLOW_REQUESTS_CHANGED = 'follow-requests-changed'

export const notifyFollowRequestsChanged = (): void => {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(FOLLOW_REQUESTS_CHANGED))
}

// Sidebar badge text: empty when there is nothing pending.
export const badgeLabel = (count: number): string => {
  if (!Number.isFinite(count) || count <= 0) return ''
  return count > 99 ? '99+' : String(count)
}

export const removeEntry = (list: FollowEntry[], username: string): FollowEntry[] =>
  list.filter((e) => e.user.username !== username)

// 404 means the requester is gone or blocked us meanwhile.
export const isGone = (error: unknown): boolean =>
  (error as { response?: { status?: number } } | null)?.response?.status === 404
