const statusOf = (error: unknown): number | undefined =>
  (error as { response?: { status?: number } } | null)?.response?.status

const GENERIC = 'Something went wrong. Please try again.'

export const emailStartErrorMessage = (error: unknown): string => {
  switch (statusOf(error)) {
    case 429:
      return 'Too many login attempts. Please try again later.'
    case 400:
      return 'Please enter a valid email address.'
    default:
      return GENERIC
  }
}

// `null` means the link had no token at all.
export const verifyErrorMessage = (error: unknown): string =>
  error === null || statusOf(error) === 400 ? 'This login link is invalid or has expired.' : GENERIC

export const loginErrorMessage = (error: unknown): string => {
  const status = statusOf(error)
  return status === 400 || status === 401 ? 'Google sign-in failed. Please try again.' : GENERIC
}
