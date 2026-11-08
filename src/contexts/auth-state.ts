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
  | { type: 'hydrateFailed' }
  | { type: 'reset' }

export const initialAuthState: AuthState = { status: 'loading', user: null }

const ANON: AuthState = { status: 'anon', user: null }

export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'hydrated':
      // A slow /me from the stored token must not override a login/logout that won the race.
      if (state.status !== 'loading') return state
      return action.user ? { status: 'authed', user: action.user } : ANON
    case 'hydrateFailed':
      // /me failed for a reason other than a 401 (network, 5xx): the token is kept (the
      // session may be fine), but this page load shows the anonymous UI.
      return state.status === 'loading' ? ANON : state
    case 'reset':
      // The stored session changed in another tab: look it up again.
      return initialAuthState
    case 'login':
      return { status: 'authed', user: action.user }
    case 'logout':
    case 'unauthorized':
      return ANON
    case 'userUpdated':
      return state.status === 'authed' ? { status: 'authed', user: action.user } : state
  }
}

export type HydrationStep = 'anon' | 'retry' | 'unknown'

// What to do after /me failed during hydration. Only a 401 proves the session is dead
// (the interceptor already cleared the token). Anything else is retried once, then the
// user is shown as anonymous without touching the stored token.
export const hydrationStep = (error: unknown, attempt: number): HydrationStep => {
  const status = (error as { response?: { status?: number } } | null)?.response?.status
  if (status === 401) return 'anon'
  return attempt < 1 ? 'retry' : 'unknown'
}

// Where to send the user after the API rejected their session; null = stay (auth pages, to
// avoid loops). Requests that must not redirect (hydration, logout) opt out per request
// with `skipAuthRedirect`, so no event reaches this.
export const unauthorizedRedirect = (pathname: string, search: string): string | null => {
  if (isAuthPath(pathname)) return null
  return loginPath(`${pathname}${search}`)
}
