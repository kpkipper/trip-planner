// URLs from user content (avatars, covers) are rendered only when they are https.
export const safeHttpsUrl = (url: string | null | undefined): string | null => {
  if (!url) return null
  try {
    return new URL(url).protocol === 'https:' ? url : null
  } catch {
    return null
  }
}
