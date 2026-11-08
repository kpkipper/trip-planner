import { describe, expect, it } from 'vitest'

import { authReducer, initialAuthState, unauthorizedRedirect } from './auth-state'

import type { AuthState } from './auth-state'
import type { User } from '@/api/me/type'

const alice: User = {
  id: 'u1',
  email: 'alice@example.com',
  username: 'alice',
  display_name: 'Alice',
  avatar_url: '',
  bio: '',
  created_at: '2026-11-01T00:00:00Z',
  updated_at: '2026-11-01T00:00:00Z',
}
const bob: User = { ...alice, id: 'u2', username: 'bob', email: 'bob@example.com' }

const authed = (user: User): AuthState => ({ status: 'authed', user })
const anon: AuthState = { status: 'anon', user: null }

describe('authReducer', () => {
  it('starts loading with no user', () => {
    expect(initialAuthState).toEqual({ status: 'loading', user: null })
  })

  it('hydrates to authed with a user or anon without one', () => {
    expect(authReducer(initialAuthState, { type: 'hydrated', user: alice })).toEqual(authed(alice))
    expect(authReducer(initialAuthState, { type: 'hydrated', user: null })).toEqual(anon)
  })

  it('ignores a late hydration once login/logout already decided the state', () => {
    expect(authReducer(authed(bob), { type: 'hydrated', user: alice })).toEqual(authed(bob))
    expect(authReducer(authed(bob), { type: 'hydrated', user: null })).toEqual(authed(bob))
    expect(authReducer(anon, { type: 'hydrated', user: alice })).toEqual(anon)
  })

  it('logs in from any state', () => {
    expect(authReducer(initialAuthState, { type: 'login', user: alice })).toEqual(authed(alice))
    expect(authReducer(anon, { type: 'login', user: alice })).toEqual(authed(alice))
    expect(authReducer(authed(bob), { type: 'login', user: alice })).toEqual(authed(alice))
  })

  it('logout and unauthorized always end anon', () => {
    for (const s of [initialAuthState, anon, authed(alice)]) {
      expect(authReducer(s, { type: 'logout' })).toEqual(anon)
      expect(authReducer(s, { type: 'unauthorized' })).toEqual(anon)
    }
  })

  it('updates the user only while authed', () => {
    const renamed = { ...alice, username: 'alice2' }
    expect(authReducer(authed(alice), { type: 'userUpdated', user: renamed })).toEqual(
      authed(renamed),
    )
    expect(authReducer(anon, { type: 'userUpdated', user: renamed })).toEqual(anon)
    expect(authReducer(initialAuthState, { type: 'userUpdated', user: renamed })).toEqual(
      initialAuthState,
    )
  })
})

describe('unauthorizedRedirect', () => {
  it('sends the user to login with the current page as next', () => {
    expect(unauthorizedRedirect('/plans/tokyo', '')).toBe('/login?next=%2Fplans%2Ftokyo')
    expect(unauthorizedRedirect('/plans/create', '?a=1')).toBe(
      '/login?next=%2Fplans%2Fcreate%3Fa%3D1',
    )
  })

  it('does not redirect from the auth pages (no loops)', () => {
    expect(unauthorizedRedirect('/login', '?next=%2Fplans')).toBeNull()
    expect(unauthorizedRedirect('/login/', '')).toBeNull()
    expect(unauthorizedRedirect('/auth/verify', '')).toBeNull()
    expect(unauthorizedRedirect('/auth/verify/', '')).toBeNull()
  })

  it('drops next for the home page', () => {
    expect(unauthorizedRedirect('/', '')).toBe('/login')
  })
})
