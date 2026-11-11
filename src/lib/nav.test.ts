import { describe, expect, it } from 'vitest'

import { isActive, navItems } from './nav'

describe('navItems', () => {
  it('is empty when not logged in', () => {
    expect(navItems(false)).toEqual([])
  })

  it('gives Feed, My trips, Follow requests in that order when logged in', () => {
    expect(navItems(true)).toEqual([
      { href: '/feed', label: 'Feed', icon: 'feed' },
      { href: '/trips', label: 'My trips', icon: 'trips' },
      { href: '/follow-requests', label: 'Follow requests', icon: 'requests' },
    ])
  })
})

describe('isActive', () => {
  it('matches with a trailing slash', () => {
    expect(isActive('/feed/', '/feed')).toBe(true)
  })

  it('matches without a trailing slash', () => {
    expect(isActive('/feed', '/feed')).toBe(true)
  })

  it('does not match a longer path that only shares a prefix', () => {
    expect(isActive('/feeds', '/feed')).toBe(false)
  })

  it('matches /trips exactly', () => {
    expect(isActive('/trips', '/trips')).toBe(true)
  })

  it('matches nested paths for /trips', () => {
    expect(isActive('/trips/', '/trips')).toBe(true)
    expect(isActive('/trips/shared', '/trips')).toBe(true)
  })

  it('does not match nested paths for other items', () => {
    expect(isActive('/feed/x', '/feed')).toBe(false)
  })

  it('does not match other pages', () => {
    expect(isActive('/follow-requests', '/feed')).toBe(false)
    expect(isActive('/', '/trips')).toBe(false)
  })
})
