'use client'

import { createContext, useCallback, useContext, useEffect, useReducer, useRef } from 'react'

import { useRouter } from 'next/navigation'

import { logout as logoutRequest } from '@/api/auth'
import { UNAUTHORIZED_EVENT } from '@/api/httpClient/apiClient'
import { getMe } from '@/api/me'
import { clearToken, getToken, setToken } from '@/lib/session'

import { authReducer, initialAuthState, unauthorizedRedirect } from './auth-state'

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
  const statusRef = useRef<AuthStatus>(state.status)

  useEffect(() => {
    statusRef.current = state.status
  }, [state.status])

  // Hydrate after mount: the token only exists in the browser.
  useEffect(() => {
    if (!getToken()) {
      dispatch({ type: 'hydrated', user: null })
      return
    }
    getMe()
      .then((user) => dispatch({ type: 'hydrated', user }))
      .catch(() => dispatch({ type: 'hydrated', user: null }))
  }, [])

  useEffect(() => {
    const onUnauthorized = () => {
      const target = unauthorizedRedirect(
        statusRef.current,
        window.location.pathname,
        window.location.search,
      )
      dispatch({ type: 'unauthorized' })
      if (target) router.push(target)
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
