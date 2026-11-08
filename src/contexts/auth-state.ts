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

// Where to send the user after the API rejected their session; null = stay.
// While hydrating, a 401 only means the stored token expired: the user may just be reading
// a public trip, so they become anonymous without being bounced to the login page.
export const unauthorizedRedirect = (
  status: AuthStatus,
  pathname: string,
  search: string,
): string | null => {
  if (status === 'loading' || isAuthPath(pathname)) return null
  return loginPath(`${pathname}${search}`)
}
