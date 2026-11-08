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
