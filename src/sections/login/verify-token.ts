const VERIFY_PATH = '/auth/verify'

// Reads the one-time login token from the emailed link and returns the same-origin URL to
// put in the address bar without it, so the token does not stay in history or a Referer.
export const consumeVerifyToken = (href: string): { token: string | null; cleanUrl: string } => {
  let url: URL
  try {
    url = new URL(href)
  } catch {
    return { token: null, cleanUrl: VERIFY_PATH }
  }
  const token = url.searchParams.get('token') || null
  url.searchParams.delete('token')
  // A pathname starting with "//" would be read as a protocol-relative URL by replaceState.
  const pathname = url.pathname.startsWith('//') ? VERIFY_PATH : url.pathname
  return { token, cleanUrl: `${pathname}${url.search}${url.hash}` }
}
