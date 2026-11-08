'use client'

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { LinkIcon } from 'lucide-react'

import { verifyEmailLogin } from '@/api/auth'
import PageLoading from '@/components/page-loading'
import { useAuth } from '@/contexts/auth-context'
import { safeNext } from '@/lib/safe-next'

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
    const next = safeNext(new URL(cleanUrl, window.location.origin).searchParams.get('next'))

    const verify = token ? verifyEmailLogin(token) : Promise.reject(null)
    verify
      .then((session) => {
        login(session.token, session.user)
        router.replace(next)
      })
      .catch((err) => setError(verifyErrorMessage(err)))
  }, [login, router])

  if (!error) return <PageLoading />

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#0163a4] to-[#38bdf8] flex items-center justify-center mb-6 shadow-xl shadow-[#0163a4]/20">
        <LinkIcon size={34} className="text-white" strokeWidth={1.5} />
      </div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Can&apos;t log you in</h1>
      <p className="text-gray-400 text-sm max-w-xs leading-relaxed mb-6">{error}</p>
      <Link
        href="/login"
        className="rounded-lg px-4 py-2.5 bg-[#0163a4] text-white hover:bg-[#0470b9] transition-colors text-sm font-medium"
      >
        Back to login
      </Link>
    </div>
  )
}
