import { isAuthPath, loginPath } from '@/lib/safe-next'

import type { User } from '@/api/me/type'

export type AuthStatus = 'loading' | 'anon' | 'authed'

export interface AuthState {
  status: AuthStatus
  user: User | null
}

export type AuthAction =
  | { type: 'hydrated'; user: User | null }
  | { type: 'login'; user: User }
  | { type: 'logout' }
  | { type: 'unauthorized' }
  | { type: 'userUpdated'; user: User }

export const initialAuthState: AuthState = { status: 'loading', user: null }

const ANON: AuthState = { status: 'anon', user: null }

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'hydrated':
      // A slow /me from the stored token must not override a login/logout that won the race.
      if (state.status !== 'loading') return state
      return action.user ? { status: 'authed', user: action.user } : ANON
    case 'login':
      return { status: 'authed', user: action.user }
    case 'logout':
    case 'unauthorized':
      return ANON
    case 'userUpdated':
      return state.status === 'authed' ? { status: 'authed', user: action.user } : state
  }
}

// Where to send the user after the API rejected their session; null = stay (auth pages, to
// avoid loops). Requests that must not redirect (hydration, logout) opt out per request
// with `skipAuthRedirect`, so no event reaches this.
export const unauthorizedRedirect = (pathname: string, search: string): string | null => {
  if (isAuthPath(pathname)) return null
  return loginPath(`${pathname}${search}`)
}
