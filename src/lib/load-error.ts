export type LoadErrorKind = 'not-found' | 'forbidden' | 'error'

// Decides what a failed (or 404-in-body) trip load means for the UI.
// Returns null when there is no error.
export const classifyLoadError = (
  error: unknown,
  body?: { code?: string },
): LoadErrorKind | null => {
  if (error === undefined || error === null) {
    return body?.code === 'JOURNEY-404000' ? 'not-found' : null
  }
  const status = (error as { response?: { status?: number } }).response?.status
  if (status === 404) return 'not-found'
  if (status === 403) return 'forbidden'
  return 'error'
}
