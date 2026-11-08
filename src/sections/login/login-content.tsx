'use client'

import { useEffect, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { Mail } from 'lucide-react'

import { loginWithGoogle, startEmailLogin } from '@/api/auth'
import Logo from '@/components/logo'
import PageLoading from '@/components/page-loading'
import { useAuth } from '@/contexts/auth-context'
import { safeNext } from '@/lib/safe-next'

import { emailStartErrorMessage, loginErrorMessage } from './errors'
import GoogleButton from './google-button'

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''

export default function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = safeNext(searchParams.get('next'))
  const { status, login } = useAuth()

  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [googleBusy, setGoogleBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Already logged in (or just logged in with Google): go where the user was headed.
  useEffect(() => {
    if (status === 'authed') router.replace(next)
  }, [status, next, router])

  const handleGoogle = (idToken: string) => {
    setError(null)
    setGoogleBusy(true)
    loginWithGoogle(idToken)
      .then(({ token, user }) => login(token, user))
      .catch((err) => {
        setError(loginErrorMessage(err))
        setGoogleBusy(false)
      })
  }

  const handleEmail = (e: React.FormEvent) => {
    e.preventDefault()
    const value = email.trim()
    if (!value || sending) return
    setError(null)
    setSending(true)
    startEmailLogin(value)
      .then(() => setSentTo(value))
      .catch((err) => setError(emailStartErrorMessage(err)))
      .finally(() => setSending(false))
  }

  if (status !== 'anon' || googleBusy) return <PageLoading />

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-10">
      <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <div className="flex justify-center mb-6">
          <Logo size={36} />
        </div>

        {sentTo ? (
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#edf3f7] text-[#0163a4] flex items-center justify-center mb-4">
              <Mail size={26} />
            </div>
            <h1 className="text-xl font-bold text-gray-800 mb-2">Check your email</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              We sent a login link to <span className="font-medium text-gray-700">{sentTo}</span>.
              The link works once and expires in 15 minutes.
            </p>
            <button
              type="button"
              onClick={() => {
                setSentTo(null)
                setError(null)
              }}
              className="mt-6 text-sm font-medium text-[#0163a4] hover:underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-800 text-center mb-1">Log in</h1>
            <p className="text-sm text-gray-400 text-center mb-6">
              Plan trips and share them with friends.
            </p>

            {GOOGLE_CLIENT_ID && (
              <>
                <GoogleButton clientId={GOOGLE_CLIENT_ID} onCredential={handleGoogle} />
                <div className="flex items-center gap-3 my-5 text-xs text-gray-400">
                  <div className="flex-1 border-t border-gray-200" />
                  or
                  <div className="flex-1 border-t border-gray-200" />
                </div>
              </>
            )}

            <form onSubmit={handleEmail} className="flex flex-col gap-3">
              <label htmlFor="login-email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0163a4]/30 focus:border-[#0163a4]"
              />
              <button
                type="submit"
                disabled={sending}
                className="flex items-center justify-center gap-2 w-full rounded-lg px-3 py-2.5 bg-[#0163a4] text-white hover:bg-[#0470b9] transition-colors text-sm font-medium disabled:opacity-60"
              >
                <Mail size={16} />
                {sending ? 'Sending…' : 'Email me a login link'}
              </button>
            </form>
          </>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-500 text-center">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
