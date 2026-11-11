'use client'

import { useEffect, useState } from 'react'

import { useRouter, useSearchParams } from 'next/navigation'

import { Mail } from 'lucide-react'

import { loginWithGoogle, startEmailLogin } from '@/api/auth'
import Logo from '@/components/logo'
import PageLoading from '@/components/page-loading'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { storeLoginNext } from '@/lib/login-next'
import { safeNext } from '@/lib/safe-next'
import { buttonClass, cn, fieldClass } from '@/lib/ui-classes'

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
    // The emailed link can't carry the destination, so remember it for /auth/verify.
    storeLoginNext(next)
    startEmailLogin(value)
      .then(() => setSentTo(value))
      .catch((err) => setError(emailStartErrorMessage(err)))
      .finally(() => setSending(false))
  }

  if (status !== 'anon' || googleBusy) return <PageLoading />

  return (
    <div className="flex min-h-[70dvh] flex-col items-center justify-center bg-bg px-4 py-10">
      <Card padding="p-8" className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <Logo size={36} />
        </div>

        {sentTo ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-tile bg-accent-soft text-accent">
              <Mail size={26} />
            </div>
            <h1 className="mb-2 text-xl font-semibold leading-normal tracking-tight text-ink">
              Check your email
            </h1>
            <p className="text-sm leading-relaxed text-muted">
              We sent a login link to{' '}
              <span className="break-all font-medium text-ink">{sentTo}</span>.
              The link works once and expires in 15 minutes.
            </p>
            <button
              type="button"
              onClick={() => {
                setSentTo(null)
                setError(null)
              }}
              className={cn(buttonClass('ghost', 'md'), 'mt-6 text-accent hover:text-accent')}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-center text-2xl font-semibold leading-normal tracking-tight text-ink">
              Log in
            </h1>
            <p className="mb-6 text-center text-sm leading-normal text-muted">
              Plan trips and share them with friends.
            </p>

            {GOOGLE_CLIENT_ID && (
              <>
                <GoogleButton clientId={GOOGLE_CLIENT_ID} onCredential={handleGoogle} />
                <div className="my-5 flex items-center gap-3 text-xs leading-normal text-muted">
                  <div className="flex-1 border-t border-line" />
                  or
                  <div className="flex-1 border-t border-line" />
                </div>
              </>
            )}

            <form onSubmit={handleEmail} className="flex flex-col gap-2">
              <label htmlFor="login-email" className="text-[13px] font-medium leading-normal text-muted">
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
                className={`${fieldClass} w-full`}
              />
              <button
                type="submit"
                disabled={sending}
                className={`${buttonClass('primary', 'lg')} mt-2 w-full`}
              >
                <Mail size={16} />
                {sending ? 'Sending…' : 'Email me a login link'}
              </button>
            </form>
          </>
        )}

        {error && (
          <p role="alert" className="mt-4 text-center text-sm leading-normal text-danger">
            {error}
          </p>
        )}
      </Card>
    </div>
  )
}
