const AUTH_PAGES = ['/login', '/auth/verify']
const PROBE_ORIGIN = 'https://next.invalid'

const isAuthPage = (pathname: string) =>
  AUTH_PAGES.some((page) => pathname === page || pathname === `${page}/`)

// Only same-origin relative paths are allowed as a post-login destination, so a crafted
// `?next=` can never send the user to another site (open redirect).
export const safeNext = (next: string | null | undefined, fallback = '/'): string => {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return fallback
  // Browsers treat "\" like "/" and drop tabs/newlines, so "/\evil.com" or "/\t/evil.com"
  // would become "//evil.com".
  if (/[\\\u0000-\u001f\u007f\s]/.test(next)) return fallback
  try {
    const url = new URL(next, PROBE_ORIGIN)
    if (url.origin !== PROBE_ORIGIN) return fallback
    if (isAuthPage(url.pathname)) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}

export const isAuthPath = isAuthPage

export const loginPath = (next?: string | null): string => {
  const target = safeNext(next)
  return target === '/' ? '/login' : `/login?next=${encodeURIComponent(target)}`
}
