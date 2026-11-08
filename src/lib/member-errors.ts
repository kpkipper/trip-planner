interface FailedRequest {
  response?: { status?: number; data?: { message?: unknown } }
}

const GENERIC = 'Something went wrong. Please try again.'
const FULL = 'The trip is full (20 people max)'

const parts = (error: unknown) => {
  const res = (error as FailedRequest | null)?.response
  const message = typeof res?.data?.message === 'string' ? res.data.message : ''
  return { status: res?.status, message }
}

// Friendly text for a failed member / invite request.
export const memberErrorMessage = (error: unknown): string => {
  const { status, message } = parts(error)
  switch (status) {
    case 409:
      return /full/i.test(message) ? FULL : 'This person is already a member'
    case 404:
      return /user/i.test(message) ? 'User not found' : 'Not found. It may have been removed.'
    case 403:
      return "You don't have permission to do that"
    case 400:
      return message || GENERIC
    default:
      return GENERIC
  }
}

// Joining through a link: any 404 (and a malformed token, 400) means a dead link.
export const joinErrorMessage = (error: unknown): string => {
  const { status } = parts(error)
  if (status === 404 || status === 400) return 'This invite link has expired or was revoked'
  if (status === 409) return FULL
  return GENERIC
}
