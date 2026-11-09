// Signed media URLs last 30-90 minutes.
export const STALE_AFTER_MS = 50 * 60_000
export const ERROR_REFRESH_GAP_MS = 5 * 60_000

// Tab became visible again: reload when the last load is older than 50 minutes.
export const shouldRefreshOnVisible = (lastLoadAt: number, now: number): boolean =>
  now - lastLoadAt > STALE_AFTER_MS

// An <img>/<video> failed to load: reload at most once per 5 minutes.
export const shouldRefreshOnError = (lastErrorRefreshAt: number | null, now: number): boolean =>
  lastErrorRefreshAt === null || now - lastErrorRefreshAt >= ERROR_REFRESH_GAP_MS
