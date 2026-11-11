'use client'

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { LinkIcon } from 'lucide-react'

import { verifyEmailLogin } from '@/api/auth'
import PageLoading from '@/components/page-loading'
import { useAuth } from '@/contexts/auth-context'
import { consumeLoginNext } from '@/lib/login-next'
import { buttonClass } from '@/lib/ui-classes'

import { verifyErrorMessage } from './errors'
import { consumeVerifyToken } from './verify-token'

export default function VerifyContent() {
  const router = useRouter()
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    const { token, cleanUrl } = consumeVerifyToken(window.location.href)
    // Drop the one-time token from the address bar and history before any request.
    window.history.replaceState(null, '', cleanUrl)

    const verify = token ? verifyEmailLogin(token) : Promise.reject(null)
    verify
      .then((session) => {
        login(session.token, session.user)
        router.replace(consumeLoginNext())
      })
      .catch((err) => setError(verifyErrorMessage(err)))
  }, [login, router])

  if (!error) return <PageLoading />

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center mb-6 shadow-soft">
        <LinkIcon size={34} className="text-white" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Can&apos;t log you in</h1>
      <p className="text-gray-400 text-sm max-w-xs leading-relaxed mb-6">{error}</p>
      <Link
        href="/login"
        className={buttonClass('primary', 'md')}
      >
        Back to login
      </Link>
    </div>
  )
}
