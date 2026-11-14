const statusOf = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } } | null)?.response?.status

const GENERIC = 'Something went wrong. Please try again.'
const EMAIL_OFF = 'Email login is turned off.'

export const emailStartErrorMessage = (error: unknown): string => {
  switch (statusOf(error)) {
    case 429:
      return 'Too many login attempts. Please try again later.'
    case 400:
      return 'Please enter a valid email address.'
    case 403:
      return EMAIL_OFF
    default:
      return GENERIC
  }
}

// `null` means the link had no token at all.
export const verifyErrorMessage = (error: unknown): string => {
  if (error === null || statusOf(error) === 400) return 'This login link is invalid or has expired.'
  return statusOf(error) === 403 ? EMAIL_OFF : GENERIC
}

export const loginErrorMessage = (error: unknown): string => {
  const status = statusOf(error)
  return status === 400 || status === 401 ? 'Google sign-in failed. Please try again.' : GENERIC
}
