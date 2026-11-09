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

// Signed media URLs (moment photos/videos): https, or http on localhost outside production
// (the local dev backend serves uploads itself).
export const safeMediaUrl = (url: string | null | undefined): string | null => {
  if (!url) return null
  try {
    const u = new URL(url)
    if (u.protocol === 'https:') return url
    if (
      u.protocol === 'http:' &&
      process.env.NODE_ENV !== 'production' &&
      DEV_MEDIA_HOSTS.includes(u.hostname)
    )
      return url
    return null
  } catch {
    return null
  }
}
