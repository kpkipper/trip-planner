import { safeNext } from './safe-next'
import { storage } from './session'

// The emailed login link opens /auth/verify without the page the user was headed to, so the
// destination is remembered here when the email is requested.
const KEY = 'jp.loginNext'
export const LOGIN_NEXT_MAX_AGE_MS = 30 * 60 * 1000

export const storeLoginNext = (next: string | null | undefined, now = Date.now()): void => {
  try {
    storage()?.setItem(KEY, JSON.stringify({ next: safeNext(next), at: now }))
  } catch {
    // storage unavailable; the user lands on the home page instead
  }
}

// Reads and clears the remembered destination; '/' when missing, stale or malformed.
export const consumeLoginNext = (now = Date.now()): string => {
  let raw: string | null = null
  try {
    raw = storage()?.getItem(KEY) ?? null
    storage()?.removeItem(KEY)
  } catch {
    return '/'
  }
  if (!raw) return '/'
  try {
    const parsed = JSON.parse(raw) as { next?: unknown; at?: unknown } | null
    if (!parsed || typeof parsed.next !== 'string' || typeof parsed.at !== 'number') return '/'
    const age = now - parsed.at
    if (age < 0 || age > LOGIN_NEXT_MAX_AGE_MS) return '/'
    return safeNext(parsed.next)
  } catch {
    return '/'
  }
}
