'use client'

import { useEffect, useRef, useState } from 'react'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { LinkIcon } from 'lucide-react'

import { verifyEmailLogin } from '@/api/auth'
import PageLoading from '@/components/page-loading'
import { StatusCard } from '@/components/ui/status-card'
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
    <StatusCard icon={<LinkIcon size={26} strokeWidth={1.75} />} title="Can't log you in">
      <p className="mt-2 mb-6 text-sm leading-relaxed text-muted">{error}</p>
      <Link href="/login" className={buttonClass('primary', 'md')}>
        Back to login
      </Link>
    </StatusCard>
  )
}
