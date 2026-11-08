'use client'

import { createContext, useCallback, useContext, useEffect, useReducer, useState } from 'react'

import { useRouter } from 'next/navigation'

import { logout as logoutRequest } from '@/api/auth'
import { UNAUTHORIZED_EVENT } from '@/api/httpClient/apiClient'
import { getMe } from '@/api/me'
import { clearToken, getToken, isSessionKey, setToken } from '@/lib/session'

import { authReducer, hydrationStep, initialAuthState, unauthorizedRedirect } from './auth-state'

import type { AuthStatus } from './auth-state'
import type { User } from '@/api/me/type'

interface AuthContextValue {
  status: AuthStatus
  user: User | null
  login: (token: string, user: User) => void
  logout: () => void
  setUser: (user: User) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [state, dispatch] = useReducer(authReducer, initialAuthState)
  // Bumped when another tab changes the stored session, to look the user up again.
  const [epoch, setEpoch] = useState(0)

  // Hydrate after mount: the token only exists in the browser.
  useEffect(() => {
    if (!getToken()) {
      dispatch({ type: 'hydrated', user: null })
      return
    }
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const hydrate = (attempt: number) => {
      // An expired stored token only makes the user anonymous: they may be reading a public
      // trip, so this request opts out of the 401 → login redirect.
      getMe({ skipAuthRedirect: true })
        .then((user) => !cancelled && dispatch({ type: 'hydrated', user }))
        .catch((err) => {
          if (cancelled) return
          const step = hydrationStep(err, attempt)
          if (step === 'anon') dispatch({ type: 'hydrated', user: null })
          else if (step === 'retry') timer = setTimeout(() => hydrate(attempt + 1), 1500)
          else dispatch({ type: 'hydrateFailed' })
        })
    }
    hydrate(0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [epoch])

  // The session was changed or removed in another tab.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (!isSessionKey(e.key)) return
      if (!e.newValue) {
        dispatch({ type: 'logout' })
        return
      }
      dispatch({ type: 'reset' })
      setEpoch((n) => n + 1)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    const onUnauthorized = () => {
      const target = unauthorizedRedirect(window.location.pathname, window.location.search)
      dispatch({ type: 'unauthorized' })
      if (target) router.replace(target)
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [router])

  const login = useCallback((token: string, user: User) => {
    setToken(token)
    dispatch({ type: 'login', user })
  }, [])

  const logout = useCallback(() => {
    const token = getToken()
    // Forget the session locally first so the app is logged out even if the request fails.
    clearToken()
    dispatch({ type: 'logout' })
    router.push('/')
    if (token) logoutRequest(token).catch(() => {})
  }, [router])

  const setUser = useCallback((user: User) => dispatch({ type: 'userUpdated', user }), [])

  return (
    <AuthContext.Provider
      value={{ status: state.status, user: state.user, login, logout, setUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
