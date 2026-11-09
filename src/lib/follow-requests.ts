import type { FollowEntry } from '@/api/follows/type'

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
