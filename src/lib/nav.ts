// Main navigation shared by the desktop top nav and the mobile tab bar.

export type NavIcon = 'feed' | 'trips' | 'requests'

export interface NavItem {
  href: string
  // Full name: the accessible name everywhere, and the visible label where there is room.
  label: string
  // Visible label where space is tight (mobile tab bar, top nav below lg).
  shortLabel: string
  icon: NavIcon
}

const AUTHED_ITEMS: readonly NavItem[] = [
  { href: '/feed', label: 'Feed', shortLabel: 'Feed', icon: 'feed' },
  { href: '/trips', label: 'My trips', shortLabel: 'Trips', icon: 'trips' },
  { href: '/follow-requests', label: 'Follow requests', shortLabel: 'Requests', icon: 'requests' },
]

// Anonymous visitors get the public trips list (and Log in, outside this list).
const ANON_ITEMS: readonly NavItem[] = [
  { href: '/trips', label: 'Trips', shortLabel: 'Trips', icon: 'trips' },
]

export const navItems = (authed: boolean): NavItem[] =>
  (authed ? AUTHED_ITEMS : ANON_ITEMS).map((item) => ({ ...item }))

// Sections that also own the pages below them.
const NESTED = new Set(['/trips'])

const trimSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, '') : path)

// Static export with trailing slashes: "/feed/" and "/feed" are the same page.
export const isActive = (pathname: string, href: string): boolean => {
  const path = trimSlash(pathname)
  const target = trimSlash(href)
  if (path === target) return true
  return NESTED.has(target) && path.startsWith(`${target}/`)
}

const safeDecode = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

// Whether pathname is `username`'s profile page. The router may report the path
// percent-encoded or decoded, so both sides are compared decoded.
export const isProfilePath = (pathname: string, username: string): boolean =>
  safeDecode(trimSlash(pathname)) === `/u/${username}`
