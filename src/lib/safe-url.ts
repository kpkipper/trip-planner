// URLs from user content (avatars, covers) are rendered only when they are https.
export const safeHttpsUrl = (url: string | null | undefined): string | null => {
  if (!url) return null
  try {
    return new URL(url).protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

// Links from user content (map links) are rendered only when they are http(s).
export const safeHttpUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:' ? url : undefined
  } catch {
    return undefined
  }
}

const DEV_MEDIA_HOSTS = ['localhost', '127.0.0.1']

const pageIsLocal = (): boolean =>
  typeof window !== 'undefined' && DEV_MEDIA_HOSTS.includes(window.location.hostname)

// Signed media URLs (moment photos/videos): https always; http on localhost / 127.0.0.1 only
// outside production builds or when the page itself is served from localhost (the local dev
// backend serves uploads itself, and `pnpm build` inlines NODE_ENV=production).
export const safeMediaUrl = (url: string | null | undefined): string | null => {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.protocol === 'https:') return url
    if (
      u.protocol === 'http:' &&
      DEV_MEDIA_HOSTS.includes(u.hostname) &&
      (process.env.NODE_ENV !== 'production' || pageIsLocal())
    )
      return url
    return null
  } catch {
    return null
  }
}
